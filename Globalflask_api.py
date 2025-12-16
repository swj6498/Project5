# global_flask_api.py

from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime, timedelta
import os
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import redis, json

import time
import threading
import asyncio
from scripts.global_news_crawler import task_global_crawling

app = Flask(__name__)
CORS(app)

# ==========================
# MongoDB & Redis 설정 (해외)
# ==========================
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask(global)")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_global"]          # ✅ 해외 컬렉션

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6380/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
CACHE_TTL = 300

# ==========================
# pubDate 파싱
# ==========================
def _parse_pub_date(value):
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        v = value.strip()
        if not v:
            return None
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except Exception:
            pass
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(v, fmt)
            except ValueError:
                continue
    return None

# ==========================
# 오래된 해외 뉴스 삭제
# ==========================
def delete_old_global_news(days: int = 30):
    threshold = datetime.now() - timedelta(days=days)
    try:
        result = collection.delete_many({"pubDate": {"$lt": threshold}})
        print(f"[GLOBAL CLEANUP] {result.deleted_count}개 삭제 (기준일: {threshold})")
    except Exception as e:
        print(f"[GLOBAL CLEANUP ERROR] {e}")

def _is_valid_news(news: dict) -> bool:
    title = (news.get("title") or "").strip()
    content = (news.get("content") or "").strip()
    source = (news.get("source") or "").strip()

    # 제목 없음
    if len(title) < 5:
        return False

    # 본문 없음 or 의미 없는 문구
    if (
        len(content) < 30 or
        "enable js" in content.lower() or
        "disable any ad blocker" in content.lower()
    ):
        return False

    # 언론사 없음
    if not source:
        return False

    return True


# ==========================
# Mongo 정렬 + 페이지네이션 (해외)
# ==========================
def _sort_and_page_global(query, page, size, order):
    sort_dir = -1 if order != "asc" else 1

    cursor = (
        collection.find(query, {"_id": 0})
        .sort("pubDate", sort_dir)
        .skip(page * size)
        .limit(size * 2)  # ⭐ 중요: 필터링 대비 여유
    )

    content = []
    for news in cursor:
        if not _is_valid_news(news):
            continue

        parsed = _parse_pub_date(news.get("pubDate"))
        if parsed is None:
            continue

        news["pubDate"] = parsed.strftime("%Y-%m-%d %H:%M:%S")
        content.append(news)

        if len(content) >= size:
            break

    total_count = collection.count_documents(query)
    total_pages = (total_count + size - 1) // size
    return content, total_pages



def _cache_key_global_search(prefix, q, source, page, size, order):
    return f"{prefix}:q={q}:src={source}:page={page}:size={size}:order={order}"

# ==========================
# Redis 캐시 유틸 (해외)
# ==========================
def _cache_key_global(prefix, source, page, size, order):
    s = source or ""
    return f"{prefix}:src={s}:page={page}:size={size}:order={order}"

def get_global_with_cache(prefix, source, page, size, order, query):
    key = _cache_key_global(prefix, source, page, size, order)
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        pass

    content, total_pages = _sort_and_page_global(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    try:
        redis_client.setex(key, CACHE_TTL, json.dumps(result))
    except Exception:
        pass

    return result

# ==========================
# 라우트 (해외 목록)
# ==========================
@app.route("/news/global")
def get_global_news():
    source = unquote(request.args.get("category", "")).strip()
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("sort", "desc")

    # 🔥 대소문자/공백 안전 처리
    if source and source != "전체":
        query = {"source": {"$regex": f"^{source}$", "$options": "i"}}
    else:
        query = {}

    result = get_global_with_cache("global", source, page, size, order, query)
    return jsonify(result)

# ==========================
# 라우트 (해외 검색)
# ==========================
@app.route("/news/global/search")
def search_global_news():
    q = request.args.get("q", "").strip()
    source = unquote(request.args.get("category", "")).strip()
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("sort", "desc")

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0})

    cache_key = _cache_key_global_search(
        "global_search", q, source, page, size, order
    )

    cached = redis_client.get(cache_key)
    if cached:
        return jsonify(json.loads(cached))

    regex = {"$regex": q, "$options": "i"}
    or_query = {
        "$or": [
            {"title": regex},
            {"content": regex},
            {"author": regex},
            {"source": regex},
        ]
    }

    if source and source != "전체":
        query = {"$and": [{"source": source}, or_query]}
    else:
        query = or_query

    content, total_pages = _sort_and_page_global(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    redis_client.setex(cache_key, CACHE_TTL, json.dumps(result))
    return jsonify(result)

def run_global_crawler():
    while True:
        try:
            asyncio.run(task_global_crawling())
        except Exception as e:
            print(f"[GLOBAL CRAWLER ERROR] {e}")

        time.sleep(900)  # 15분

def warm_global_cache():
    for source in ["", "CNN", "BBC", "CNBC"]:
        get_global_with_cache(
            "global", source, page=0, size=5, order="desc",
            query={"source": {"$regex": f"^{source}$", "$options": "i"}} if source else {}
        )
# ==========================
# 서버 실행 (Render 필수)
# ==========================
if __name__ == "__main__":
    threading.Thread(target=run_global_crawler, daemon=True).start()

    try:
        warm_global_cache()
        print("[CACHE WARM] Global cache ready")
    except Exception as e:
        print("[CACHE WARM ERROR]", e)

    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
