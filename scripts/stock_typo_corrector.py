# typo_corrector.py
import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["stock"]

kospi = db["naver_kospi"]
kosdaq = db["naver_kosdaq"]

def _suggest_from_collection(coll, q: str, limit: int) -> List[Dict[str, Any]]:
    pipeline = [
        {
            "$search": {
                "index": "name_search",   # 각 컬렉션에 만든 인덱스 이름
                "autocomplete": {
                    "query": q,
                    "path": "name",
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
                "name": 1,
                "code": 1,
                "market": 1,
                "score": {"$meta": "searchScore"}
            }
        },
        {"$sort": {"score": -1}},
        {"$limit": limit}
    ]
    return list(coll.aggregate(pipeline))

def suggest_stock_terms(q: str, limit: int = 5) -> List[Dict[str, Any]]:
    q = (q or "").strip()
    if not q:
        return []

    candidates = _suggest_from_collection(kospi, q, limit) + \
                 _suggest_from_collection(kosdaq, q, limit)

    # 점수(내림차순) 우선, 같은 점수면 이름 길이(오름차순) 우선
    candidates.sort(
        key=lambda x: (-x.get("score", 0), len(x.get("name", "")))
    )
    return candidates[:limit]


def best_stock_correction(q: str) -> Dict[str, Any]:
    cands = suggest_stock_terms(q, limit=5)
    if not cands:
        return {"original": q, "corrected": q, "score": 0.0, "code": None, "market": None}

    best = cands[0]
    return {
        "original": q,
        "corrected": best["name"],
        "score": float(best.get("score", 0.0)),
        "code": best.get("code"),
        "market": best.get("market")
    }
