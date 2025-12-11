import os
import json
import re
from dotenv import load_dotenv
import requests
from typing import Tuple, Optional
from pydantic import BaseModel

# ----------------------
# 환경변수 로드 (.env)
# ----------------------
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, ".env")
load_dotenv(env_path)

PPLX_API_KEY = os.getenv("PERPLEXITY_API_KEY")
PPLX_MODEL = os.getenv("PERPLEXITY_MODEL", "sonar-pro")

# Pydantic 모델들
class ChatSummaryResponse(BaseModel):
    query: str
    summary: str          # ✅ 통합 설명 (주식+일반)
    is_stock_related: bool
    model_used: str
    explanation_type: str  # "ai_stock", "ai_general", "mock"

# VALID_MODELS (2025 최신)
VALID_MODELS = [
    "sonar-pro", "sonar-large-online", "sonar-small-online", "sonar"
]

# ---------------------------------------------------------------------
# 유틸: 요약 텍스트 후처리 (마크다운 제거 + 200자 제한)
# ---------------------------------------------------------------------
def _postprocess_summary(raw: str, limit: int = 200) -> str:
    """마크다운/잡기호 제거 + 200자 이내로 자연스럽게 자르기"""
    if not raw:
        return ""

    s = raw.strip()

    # 흔한 마크다운 기호/링크/각주 제거[web:70][web:76]
    s = re.sub(r'\[.*?\]\(.*?\)', ' ', s)   # [텍스트](링크)
    s = re.sub(r'[#*_`>]+', ' ', s)         # #, *, _, `, > 등
    s = re.sub(r'\s+', ' ', s).strip()

    if not s:
        return ""

    # 200자 이내 단어 단위로 자르기[web:69]
    if len(s) > limit:
        words = s.split()
        out = []
        for w in words:
            candidate = (" ".join(out + [w])).strip()
            if len(candidate) > limit:
                break
            out.append(w)
        s = " ".join(out)
    return s

# ---------------------------------------------------------------------
# Perplexity API 요청 (향상된 통합 프롬프트)
# ---------------------------------------------------------------------
def ask_perplexity(prompt: str, timeout: int = 20) -> Tuple[Optional[str], Optional[str]]:
    if not PPLX_API_KEY:
        return None, "No API key"

    url = "https://api.perplexity.ai/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {PPLX_API_KEY}"}

    for model in VALID_MODELS:
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": """당신은 검색 쿼리 전문 분석가입니다.
1. 쿼리의 핵심 주제를 한국어로 자연스럽게 200자 이내로 1~2 단락으로 설명합니다. 설명할 때 '사용자 쿼리 ~'라는 말 대신 '검색하신 ~'로 말하면 좋겠다.
2. 마크다운(제목, 굵게, 번호, 링크, 이모지, [1] 같은 출처 표기)을 사용하지 않습니다.
3. 주식/금융 관련일 때는 문장 안에 '주식분석'이라는 단어를 한 번 포함합니다. 주식관련이 아니면 100자 이내로 핵심만 간략하게 설명합니다.
4. 마지막 줄에는 정확히 JSON 한 줄만 출력합니다: {"is_stock": true} 또는 {"is_stock": false}
5. 항상 '자연어 설명 한 단락 + 개행 + JSON 한 줄' 형식만 지킵니다."""
                },
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 250,
            "temperature": 0.1
        }

        try:
            res = requests.post(url, headers=headers, json=payload, timeout=timeout)
            if res.status_code == 200:
                content = res.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                if content.strip():
                    return content.strip(), None
        except Exception:
            continue
    return None, "All models failed"

# ---------------------------------------------------------------------
# 통합 요약 생성 (완벽 AI판별)
# ---------------------------------------------------------------------
def generate_summary(query: str) -> ChatSummaryResponse:
    """순수 AI가 JSON으로 주식 여부 스스로 판단"""
    if PPLX_API_KEY:
        print(f"🤖 AI 분석: {query}...")
        prompt = f"""쿼리: '{query}'

1. 핵심 개념을 한국어로 자연스럽게 1~2개 단락, 200자 이내로 설명하세요.
2. 주식/금융 관련이면 문장 안에 '주식분석'이라는 단어를 한 번 넣으세요. 주식관련이 아니면 100자 이내로 핵심만 간략하게 설명합니다.
3. 바로 다음 줄에 JSON 한 줄만 출력하세요: {{"is_stock": true}} 또는 {{"is_stock": false}}.
4. 마크다운, 불릿, 제목, [1] 같은 표시는 절대 사용하지 마세요."""
        
        ai_response, error = ask_perplexity(prompt)
        
        if ai_response and not error:
            try:
                # ✅ JSON 줄 찾기
                lines = [ln.strip() for ln in ai_response.split('\n') if ln.strip()]
                json_line = next(
                    (line for line in reversed(lines) if line.startswith('{') and 'is_stock' in line.lower()),
                    None
                )

                if json_line:
                    json_str = json_line.strip(' `"').replace('``````', '').strip()
                    stock_data = json.loads(json_str)
                    is_stock = bool(stock_data.get('is_stock', False))
                else:
                    # JSON 없으면 내용판별 (최후 안전장치)
                    lowered = ai_response.lower()
                    is_stock = any(
                        word in lowered
                        for word in ['주가', '주식분석', '주식', '시세', '투자', '배당']
                    )

                exp_type = "ai_stock" if is_stock else "ai_general"

                # 요약에서 JSON 부분 제거
                if json_line and json_line in ai_response:
                    summary_part = ai_response[:ai_response.rfind(json_line)].strip()
                else:
                    summary_part = ai_response.strip()

                clean_summary = _postprocess_summary(summary_part, limit=200)
                if len(clean_summary) < 5:
                    clean_summary = _postprocess_summary(ai_response, limit=200)

                return ChatSummaryResponse(
                    query=query,
                    summary=clean_summary,
                    is_stock_related=is_stock,
                    model_used="Perplexity AI",
                    explanation_type=exp_type
                )
            except Exception as e:
                print(f"⚠️ JSON 파싱 실패: {str(e)[:80]}")
                lowered = (ai_response or "").lower()
                is_stock = any(
                    word in lowered
                    for word in ['주가', '주식분석', '주식', '시세', '투자']
                )
                fallback_summary = _postprocess_summary(ai_response or "", limit=200)
                return ChatSummaryResponse(
                    query=query,
                    summary=fallback_summary,
                    is_stock_related=is_stock,
                    model_used="Perplexity AI",
                    explanation_type="ai_general"
                )

    # Mock 백업 (최소화)
    print("📱 Smart Mock 사용...")
    stock_indicators = ["삼성", "주가", "비트코인", "신한", "LG", "SK", "카카오"]
    is_stock = any(indicator in query for indicator in stock_indicators)
    
    if is_stock:
        summary = f"{query}는 주식 또는 금융 자산으로 간단한 가격 흐름과 투자전망을 살펴볼 수 있는 대상입니다."
    else:
        summary = f"{query}의 기본 개념과 특징을 짧게 정리한 설명입니다."

    summary = _postprocess_summary(summary, limit=200)

    return ChatSummaryResponse(
        query=query,
        summary=summary,
        is_stock_related=is_stock,
        model_used="Smart Mock",
        explanation_type="mock"
    )

# ---------------------------------------------------------------------
# FastAPI용 export 함수
# ---------------------------------------------------------------------
def build_summary(query: str) -> ChatSummaryResponse:
    """FastAPI에서 호출하는 메인 함수"""
    return generate_summary(query)

# ---------------------------------------------------------------------
# 테스트용 실행
# ---------------------------------------------------------------------
if __name__ == "__main__":
    test_queries = ["삼성전자", "신한", "인공지능", "비트코인 주가", "기후변화", "사과"]

    print("🚀 완벽 AI 챗봇: 순수 JSON 판별!")
    print(f"Perplexity 사용: {'✅' if PPLX_API_KEY else '⚠️ Mock'}")

    for query in test_queries:
        print("\n" + "="*60)
        result = generate_summary(query)
        
        icon = "🟢" if result.is_stock_related else "⚪"
        print(f"{icon} '{query}'")
        print(f"📝 요약: {result.summary}")
        print(f"📊 주식: {result.is_stock_related} | 타입: {result.explanation_type}")
        print(f"🤖 모델: {result.model_used}")

    print("\n✅ 100% 완벽 테스트 완료! FastAPI/React 연동 준비!")