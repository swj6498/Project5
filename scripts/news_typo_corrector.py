# scripts/news_typo_corrector.py
import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
PPLX_API_KEY = os.getenv("PERPLEXITY_API_KEY")

client = MongoClient(MONGO_URI)
db = client["stock"]
news_terms = db["news_terms"]


# ---------------------------------------
# 🔧 편집 거리 (Levenshtein distance)
# ---------------------------------------
def levenshtein(a: str, b: str) -> int:
    dp = [[i + j if i * j == 0 else 0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (0 if a[i - 1] == b[j - 1] else 1)
            )
    return dp[-1][-1]


# ---------------------------------------
# 🔎 MongoDB Atlas Search 기반 검색
# ---------------------------------------
def _suggest_from_news_terms(q: str, limit: int) -> List[Dict[str, Any]]:
    pipeline = [
        {
            "$search": {
                "index": "news_search",
                "autocomplete": {
                    "query": q,
                    "path": "term",
                    "fuzzy": {
                        "maxEdits": 2,
                        "prefixLength": 1
                    }
                }
            }
        },
        {
            "$project": {
                "_id": 0,
                "term": 1,
                "freq": 1,
                "top_category": 1,
                "score": {"$meta": "searchScore"}
            }
        },
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]
    return list(news_terms.aggregate(pipeline))


def suggest_news_terms(q: str, limit: int = 5) -> List[Dict[str, Any]]:
    q = (q or "").strip()
    if not q:
        return []
    candidates = _suggest_from_news_terms(q, limit)
    candidates.sort(key=lambda x: (-x.get("score", 0), -x.get("freq", 0)))
    return candidates[:limit]


# ---------------------------------------
# 🤖 Perplexity LLM 기반 오타 보정
# ---------------------------------------
def llm_correct_term(original: str, candidate: Optional[str] = None) -> str:
    """Perplexity LLM을 이용한 경제/뉴스 용어 오타 자동 보정 (단어 한 개만 반환)"""
    url = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json",
    }

    if candidate:
        content = (
            "다음은 사용자가 입력한 단어와 검색 시스템이 추천한 후보입니다.\n"
            f"- 원래 단어: {original}\n"
            f"- 추천 후보: {candidate}\n\n"
            "경제·주식·뉴스 문맥에서 가장 자연스럽고 올바른 단어 하나만 출력하세요.\n"
            "설명 없이 '단어만' 출력하세요."
        )
    else:
        content = (
            "다음 단어가 경제·주식·뉴스 용어인지 판단해 주세요.\n"
            "- 올바른 용어이면 그대로 출력\n"
            "- 오타이거나 잘린 단어이면 올바른 단어로 고쳐서 출력\n"
            "설명 없이 '단어만' 출력하세요.\n\n"
            f"단어: {original}"
        )

    data = {
        "model": "llama-3.1-sonar-small-128k-online",
        "messages": [
            {
                "role": "user",
                "content": content,
            }
        ],
        "max_tokens": 10,
    }

    try:
        res = requests.post(url, headers=headers, json=data).json()
        corrected = res["choices"][0]["message"]["content"].strip()
        # 혹시 줄바꿈/공백 있으면 첫 토큰만 사용
        corrected = corrected.split()[0]
        return corrected
    except Exception:
        return candidate or original


# ---------------------------------------
# 🧠 최종 오타 자동 교정 (Mongo → LLM 하이브리드)
# ---------------------------------------
def best_news_correction(q: str) -> Dict[str, Any]:
    q = (q or "").strip()

    # 1) DB에 정확히 존재 → 그대로
    exact_doc = news_terms.find_one({"term": q})
    if exact_doc:
        return {
            "original": q,
            "corrected": q,
            "score": 100.0,
            "freq": exact_doc.get("freq", 0),
            "top_category": exact_doc.get("top_category"),
            "is_exact": True,
            "source": "mongo_exact"
        }

    # 2) Mongo fuzzy 검색 (Atlas 후보 가져오기)
    cands = suggest_news_terms(q, 5)

    # 2-1) Atlas 결과가 의미있게 있으면 → LLM에게 검수 맡기기
    if cands:
        filtered = []
        for cand in cands:
            term = cand["term"]
            if not term:
                continue
            # 첫 글자 다르면 스킵
            if q[0] != term[0]:
                continue
            # 길이 차이 너무 크면 스킵
            if abs(len(q) - len(term)) >= 4:
                continue
            dist = levenshtein(q, term)
            filtered.append((term, dist, cand))

        if filtered:
            # 편집 거리 + freq 기준으로 가장 좋은 후보
            filtered.sort(key=lambda x: (x[1], -x[2].get("freq", 0)))
            best_term, best_dist, best_cand = filtered[0]

            # Atlas 후보를 LLM에게 넘기고, 최종 단어 한 개만 받기
            corrected = llm_correct_term(original=q, candidate=best_term)

            return {
                "original": q,
                "corrected": corrected,
                "score": float(best_cand.get("score", 0.0)),
                "freq": best_cand.get("freq", 0),
                "top_category": best_cand.get("top_category"),
                "is_exact": (corrected == q),
                "source": "mongo_fuzzy+llm"
            }

    # 3) Atlas로 적당한 후보 못 찾으면 → LLM 단독으로 교정
    corrected = llm_correct_term(original=q, candidate=None)
    return {
        "original": q,
        "corrected": corrected,
        "score": 100.0,
        "freq": 0,
        "top_category": None,
        "is_exact": (corrected == q),
        "source": "perplexity_only"
    }


# ---------------------------------------
# 🧪 테스트 코드
# ---------------------------------------
def test_correction():
    test_queries = [
        "삼성저", "투자자", "금유", "인도네시", "루피아",
        "애플", "테슬러", "테슬라", "비트코인", "공매도", "이자율", "딸긔",
    ]

    print("🧪 스마트 오타 수정 테스트")
    print("-" * 50)

    for q in test_queries:
        result = best_news_correction(q)

        if result["is_exact"]:
            print(f"✅ '{q}' 정확한 용어 (빈도: {result['freq']})")
        elif result["corrected"] != q:
            print(f"🔧 '{q}' → '{result['corrected']}'  [출처: {result['source']}]")
        else:
            print(f"⏸️ '{q}' 그대로  [출처: {result['source']}]")

if __name__ == "__main__":
    test_correction()
