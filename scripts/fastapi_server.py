# C:/dev/work_springboot/Project5/scripts/fastapi_server.py
from typing import List, Dict, Any, Optional
import time
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# ✅ 모듈화된 라이브러리 임포트 (업데이트)
from nlp_search import enhanced_tokenize
from tfidf_rank_lib import rank_with_tfidf
from ime_converter import to_hangul
from chat_summary_lib import build_summary, ChatSummaryResponse
from news_typo_corrector import best_news_correction

# 🔵 환경변수 로드
load_dotenv()

app = FastAPI(title="Project5 AI Search API", version="2.1")  # 버전 업데이트

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",  # React 추가
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- NLP / TF-IDF ----------
class NlpRequest(BaseModel):
    query: str

class TfidfRequest(BaseModel):
    query: str
    documents: List[Dict[str, Any]]

@app.post("/nlp-analyze")
def nlp_analyze(req: NlpRequest):
    """NLP 토큰화 분석"""
    tokens = enhanced_tokenize(req.query)
    return {"tokens": tokens, "count": len(tokens)}

@app.post("/tfidf-rank")
def tfidf_rank(req: TfidfRequest):
    """TF-IDF 기반 문서 랭킹"""
    ranked = rank_with_tfidf(req.query, req.documents)
    return {"ranked_docs": ranked, "total": len(ranked)}

# ---------- IME 변환 / 검색 교정 ----------
class CorrectionResponse(BaseModel):
    original: str
    ime_converted: str
    corrected: str
    alternatives: List[str] = []

@app.get("/ime-convert")
def ime_convert(q: str):
    """영→한 두벌식 자판 변환"""
    converted = to_hangul(q or "")
    return {"original": q, "converted": converted}
    
@app.get("/search-correction", response_model=CorrectionResponse)
def search_correction(q: str):
    """오타 교정 + 대체 검색어 제안"""
    original = (q or "").strip()
    ime_q = to_hangul(original)
    
    corrected = ime_q if ime_q and ime_q != original else original
    alts: List[str] = []
    if ime_q and ime_q != original:
        alts.append(ime_q)

    return CorrectionResponse(
        original=original,
        ime_converted=ime_q,
        corrected=corrected,
        alternatives=alts,
    )

#IME + Atlas 교정 통합
@app.get("/news-search-correction")
def news_search_correction(q: str):
    """
    뉴스 검색어용 스마트 오타 교정
    1) IME 변환 (영타 → 한글)
    2) 뉴스 용어 오타 보정 (Mongo + LLM)
    """
    original = (q or "").strip()

    # 1) 영타 -> 한글 (예: tkatjd → 삼성전)
    ime_q = to_hangul(original)
    base_q = ime_q or original

    # 2) 뉴스 오타 교정 (예: 삼성전 → 삼성전자)
    news_corr = best_news_correction(base_q)

    return {
        "original": original,        # 사용자가 입력한 그대로
        "ime_converted": ime_q,      # 영타가 한글로 바뀐 값 (없으면 null)
        "news": news_corr,           # { original, corrected, source, ... }
    }

# ---------- ✅ Chat Summary (완전 통합 버전) ----------
class SummaryRequest(BaseModel):
    query: str

@app.post("/chat-summary", response_model=ChatSummaryResponse)  # ✅ 통합 엔드포인트
def chat_summary(req: SummaryRequest):
    """AI 기반 쿼리 자동분석 + 주식판별 (Perplexity AI)"""
    result = build_summary(req.query)  # ✅ 완벽한 chat_summary_lib 연동
    return result

@app.post("/chat-stock-analysis")  # ✅ 기존 호환성 유지
def chat_stock_analysis(query: str):
    """주식분석 전용 (호환성)"""
    result = build_summary(query)
    return {
        "query": result.query,
        "is_stock_related": result.is_stock_related,
        "explanation": result.summary,
        "model_used": result.model_used,
        "type": result.explanation_type
    }

# ---------- 디버그 엔드포인트 (임시 제거) ----------
@app.get("/debug-models")
def debug_models():
    """테스트용 - 실제 운영시 제거"""
    return {
        "status": "Perplexity AI 연동 완료",
        "models": ["sonar-pro", "sonar-large-online", "mock"],
        "recommended": "sonar-pro"
    }

# ---------- 통합 상태 확인 (업데이트) ----------
@app.get("/health")
def health_check():
    """전체 API 상태 점검"""
    try:
        # chat_summary_lib 테스트
        test_result = build_summary("삼성전자")
        chat_status = f"✅ {test_result.model_used} ({'주식' if test_result.is_stock_related else '일반'})"
    except Exception as e:
        chat_status = f"⚠️ {str(e)[:50]}"
    
    return {
        "status": "🟢 healthy",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S KST"),
        "chat_summary": chat_status,
        "endpoints": [
            "/chat-summary - AI 쿼리 자동분석 ✅",
            "/chat-stock-analysis - 주식분석 (호환)",
            "/nlp-analyze - NLP 토큰화",
            "/tfidf-rank - TF-IDF 랭킹", 
            "/ime-convert - 영→한 변환",
            "/search-correction - 오타 교정",
        ],
        "modules": {
            "chat_summary_lib": "✅ Perplexity AI 연동",
            "nlp_search": "✅ loaded",
            "tfidf_rank_lib": "✅ loaded", 
            "ime_converter": "✅ loaded"
        }
    }

# ---------- 테스트 엔드포인트 (완전화) ----------
@app.get("/test-all")
def test_all():
    """모든 모듈 동시 테스트"""
    test_query = "삼성전자 주가"
    
    return {
        "nlp": {
            "query": test_query,
            "tokens": enhanced_tokenize(test_query)
        },
        "ime": {
            "input": "sangejeonja",
            "hangul": to_hangul("sangejeonja")
        },
        "chat_summary": build_summary(test_query).dict(),  # ✅ 완전 객체 반환
        "is_production_ready": True
    }

# ---------- 서버 실행 ----------
if __name__ == "__main__":
    print("🚀 Project5 AI Search API v2.1 시작!")
    print("✅ chat_summary_lib 완전 통합 (Perplexity AI)")
    print("📱 React 연동: POST /chat-summary {query: '삼성전자'}")
    print("🌐 http://localhost:8000/health 로 상태 확인")
    print("🔍 테스트: http://localhost:8000/test-all")
    uvicorn.run("fastapi_server:app", host="0.0.0.0", port=8000, reload=True)
