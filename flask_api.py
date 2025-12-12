from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime, timedelta
import threading, time, os, asyncio

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi


from apscheduler.schedulers.background import BackgroundScheduler
from scripts.naver_news_crawler import task_korea_crawling
from scripts.global_news_crawler import task_global_crawling

# 🔹 Redis 추가
import redis
import json

app = Flask(__name__)
CORS(app)

MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]

# 🔹 로컬 테스트 기준 Redis (포트 6380)
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6380/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
CACHE_TTL = 60  # 초, 1분 캐시


def _parse_pub_date(value):
    """
    pubDate를 datetime으로 변환.
    - 이미 datetime이면 그대로 반환
    - 문자열이면 여러 포맷을 시도해서 파싱
    - 실패하면 None
    """
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
# 한 달 지난 기사 삭제
# ==========================
def delete_old_news(days: int = 30):
    """
    pubDate 기준으로 days일 지난 기사 삭제.
    pubDate는 MongoDB에 datetime 타입으로 저장되어 있다고 가정.
    """
    threshold = datetime.now() - timedelta(days=days)
    try:
        result = collection.delete_many({"pubDate": {"$lt": threshold}})
        print(f"[CLEANUP] {result.deleted_count}개 삭제 (기준일: {threshold})")
    except Exception as e:
        print(f"[CLEANUP ERROR] 오래된 뉴스 삭제 실패: {e}")


# 🔹 Mongo 쿼리에서 바로 정렬 + 페이지네이션
def _sort_and_page(query, page, size, order):
    sort_dir = -1 if order != "asc" else 1

    cursor = (
        collection.find(query, {"_id": 0})
        .sort("pubDate", sort_dir)
        .skip(page * size)
        .limit(size)
    )

    content = []
    for news in cursor:
        parsed = _parse_pub_date(news.get("pubDate"))
        if parsed is None:
            continue
        news["pubDate"] = parsed.strftime("%Y-%m-%d %H:%M:%S")
        content.append(news)

    total_count = collection.count_documents(query)
    total_pages = (total_count + size - 1) // size

    return content, total_pages


# 🔹 Redis 캐시 유틸
def _cache_key(prefix, category, page, size, order):
    cat = category or ""
    return f"{prefix}:cat={cat}:page={page}:size={size}:order={order}"


def get_news_with_cache(prefix, category, page, size, order, query):
    key = _cache_key(prefix, category, page, size, order)

    # 1) 캐시 조회
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        cached = None  # Redis 죽어 있어도 앱은 계속 돌아가게

    # 2) 캐시 미스 → Mongo에서 조회
    content, total_pages = _sort_and_page(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    # 3) 캐시에 저장
    try:
        redis_client.setex(key, CACHE_TTL, json.dumps(result))
    except Exception:
        pass

    return result


@app.route("/")
def index():
    return "Flask API is running"


@app.route("/news")
def get_news():
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    query = {"category": category} if category else {}

    # 🔹 Redis 캐시 사용
    result = get_news_with_cache("news", category, page, size, order, query)
    return jsonify(result)


@app.route("/news/search")
def search_news():
    q = request.args.get("q", "").strip()
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0})

    regex = {"$regex": q, "$options": "i"}

    or_query = {
        "$or": [
            {"title": regex},
            {"content": regex},
            {"author": regex},
            {"media": regex},
        ]
    }

    if category:
        query = {"$and": [{"category": category}, or_query]}
    else:
        query = or_query

    # 검색은 일단 캐시 없이 바로 Mongo 조회
    content, total_pages = _sort_and_page(query, page, size, order)
    return jsonify({"content": content, "number": page, "totalPages": total_pages})


def run_crawler():
    while True:
        asyncio.run(crawler.main())
        # 크롤링 한 번 끝날 때마다 30일 지난 기사 삭제
        delete_old_news(30)
        time.sleep(3600)
        
@app.route("/health")
def health():
    return "OK"

if __name__ == "__main__":
    
    # 🔹 스케줄러 설정 (전역)
    scheduler = BackgroundScheduler(daemon=True)
    
    scheduler.add_job(
        lambda: asyncio.run(task_korea_crawling()),
        'interval',
        minutes=5,
        next_run_time=datetime.now()
    )
    
    scheduler.add_job(
        lambda: asyncio.run(task_global_crawling()),
        'interval',
        minutes=15,
        next_run_time=datetime.now()
    )
    
    scheduler.start()
    print("🚀 [Scheduler] 국내/해외 뉴스 크롤러 스케줄러 가동됨")

    # [중요] 기존에 돌던 크롤러 스레드는 충돌 방지를 위해 주석 처리(#) 합니다.
    # threading.Thread(target=run_crawler, daemon=True).start() 
    
    port = int(os.environ.get("PORT", 10000)) # 렌더 포트 10000 (팀원이 8585 썼어도 렌더는 10000 권장)
    app.run(host="0.0.0.0", port=port, debug=False)
