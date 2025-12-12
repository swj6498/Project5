# scripts/news_typo_corrector.py
import os
import requests
from typing import List, Dict, Any
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# ---------------------------------------
# 환경변수에서 키 불러오기
# ---------------------------------------
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
def llm_correct_term(q: str) -> str:
    """Perplexity LLM을 이용한 경제/뉴스 용어 오타 자동 보정"""
    url = "https://api.perplexity.ai/chat/completions"

    headers = {
        "Authorization": f"Bearer {PPLX_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "llama-3.1-sonar-small-128k-online",
        "messages": [
            {
                "role": "user",
                "content": (
                    f"다음 단어가 경제·주식·뉴스 용어인지 판단해줘.\n"
                    f"- 올바르면 그대로 출력\n"
                    f"- 오타거나 잘린 단어면 정확한 단어로 충족해서 출력\n"
                    f"출력은 단어 하나만.\n\n"
                    f"단어: {q}"
                )
            }
        ],
        "max_tokens": 10,
    }

    try:
        res = requests.post(url, headers=headers, json=data).json()
        corrected = res["choices"][0]["message"]["content"].strip()
        return corrected
    except Exception:
        return q  # LLM 오류 시 원본 반환


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

    # 2) Mongo fuzzy 검색
    cands = suggest_news_terms(q, 5)
    if cands and cands[0]["score"] >= 1.0:
        best = cands[0]
        term = best["term"]

        # 필터 ①: 첫 글자 동일해야 함
        if q[0] != term[0]:
            pass  # LLM으로 넘어감
        else:
            # 필터 ②: 길이 차이 3 이상 → 제외
            if abs(len(q) - len(term)) < 3:
                # 필터 ③ 편집 거리
                if levenshtein(q, term) <= 2:
                    return {
                        "original": q,
                        "corrected": term,
                        "score": float(best.get("score", 0.0)),
                        "freq": best.get("freq", 0),
                        "top_category": best.get("top_category"),
                        "is_exact": False,
                        "source": "mongo_fuzzy"
                    }

    # 3) Mongo에서 해결 실패 → LLM 사용
    corrected = llm_correct_term(q)

    return {
        "original": q,
        "corrected": corrected,
        "score": 100.0,
        "freq": 0,
        "top_category": None,
        "is_exact": (corrected == q),
        "source": "perplexity"
    }


# ---------------------------------------
# 🧪 테스트 코드
# ---------------------------------------
def test_correction():
    test_queries = [
        "삼성전", "투자자", "금유", "인도네시", "루피아",
        "애플", "테슬라", "비트코인", "공매도", "이자율", "딸긔", 
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
