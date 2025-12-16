from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime, timedelta
import threading, time, os, asyncio

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import scripts.naver_news_crawler as crawler

# 🔹 Redis 추가
import redis
import json

app = Flask(__name__)
CORS(app)  # CORS 설정: 외부에서 API 접근 가능

# ==========================
# MongoDB & Redis 설정
# ==========================
MONGO_URI = os.environ.get("MONGO_URI")  # 환경변수로 MongoDB URI 가져오기
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask")  # URI 없으면 바로 오류

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))  # MongoDB 연결
db = client["stock"]  # stock DB 선택
collection = db["news_crawling"]  # news_crawling 컬렉션 선택

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6380/0")  # Redis 연결 주소
redis_client = redis.from_url(REDIS_URL, decode_responses=True)  # 문자열 자동 디코딩
CACHE_TTL = 60  # Redis 캐시 유효 시간 (초): 1분

# ==========================
# pubDate 파싱 유틸
# ==========================
def _parse_pub_date(value):
    """
    pubDate 필드를 datetime 객체로 변환.
    - 이미 datetime이면 그대로 반환
    - 문자열이면 여러 포맷(ISO8601, YYYY-MM-DD HH:MM:SS, YYYY-MM-DD)을 시도해서 파싱
    - 모두 실패하면 None 반환
    """
    if isinstance(value, datetime):
        return value  # 이미 datetime이면 그대로

    if isinstance(value, str):
        v = value.strip()
        if not v:
            return None  # 빈 문자열은 None

        # ISO8601 포맷 시도 (2025-01-01T10:00:00Z 등)
        try:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        except Exception:
            pass

        # YYYY-MM-DD HH:MM:SS, YYYY-MM-DD 포맷 시도
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                return datetime.strptime(v, fmt)
            except ValueError:
                continue

    return None  # 변환 실패 시 None

# ==========================
# 한 달 지난 기사 삭제
# ==========================
def delete_old_news(days: int = 30):
    """
    pubDate 기준으로 days일 지난 기사 삭제.
    - MongoDB에서 pubDate < (현재시간 - days) 인 모든 문서 삭제
    - 삭제 개수와 기준일을 로그 출력
    """
    threshold = datetime.now() - timedelta(days=days)  # 기준 시각 계산
    try:
        result = collection.delete_many({"pubDate": {"$lt": threshold}})
        print(f"[CLEANUP] {result.deleted_count}개 삭제 (기준일: {threshold})")
    except Exception as e:
        print(f"[CLEANUP ERROR] 오래된 뉴스 삭제 실패: {e}")  # 예외 발생 시 로그

# ==========================
# Mongo 정렬 + 페이지네이션
# ==========================
def _sort_and_page(query, page, size, order):
    """
    MongoDB에서 쿼리 조건에 맞는 뉴스를 정렬, 페이지네이션하여 반환.
    - query: MongoDB 조회 조건 (dict)
    - page: 페이지 번호 (0부터 시작)
    - size: 페이지당 개수
    - order: 정렬 방향 ('asc' 또는 'desc')
    - 반환: (content 리스트, total_pages)
    """
    sort_dir = -1 if order != "asc" else 1  # 내림차순: -1, 오름차순: 1

    # MongoDB 조회: 조건에 맞는 문서 정렬 후 스킵/리밋 적용
    cursor = (
        collection.find(query, {"_id": 0})  # _id 필드 제외
        .sort("pubDate", sort_dir)  # pubDate 기준 정렬
        .skip(page * size)  # 페이지 스킵
        .limit(size)  # 페이지 크기 제한
    )

    content = []
    for news in cursor:
        parsed = _parse_pub_date(news.get("pubDate"))  # pubDate 파싱
        if parsed is None:
            continue  # 파싱 실패하면 건너뜀
        news["pubDate"] = parsed.strftime("%Y-%m-%d %H:%M:%S")  # 포맷 통일
        content.append(news)

    total_count = collection.count_documents(query)  # 전체 문서 개수
    total_pages = (total_count + size - 1) // size  # 총 페이지 수 계산

    return content, total_pages

# ==========================
# Redis 캐시 유틸
# ==========================
def _cache_key(prefix, category, page, size, order):
    """
    캐시 키 생성: 동일 조건의 요청에 대해 같은 키를 사용.
    - prefix: 캐시 구분용 (예: 'news')
    - category: 카테고리 (없으면 빈 문자열)
    - page, size, order: 페이지네이션 및 정렬 정보
    - 반환: 캐시 키 문자열
    """
    cat = category or ""
    return f"{prefix}:cat={cat}:page={page}:size={size}:order={order}"

def get_news_with_cache(prefix, category, page, size, order, query):
    """
    Redis 캐시에서 뉴스 목록을 조회하고, 없으면 MongoDB에서 조회 후 캐시 저장.
    - Redis 장애 시 캐시를 무시하고 MongoDB에서 직접 조회.
    - 결과: {"content": [...], "number": page, "totalPages": total_pages}
    """
    key = _cache_key(prefix, category, page, size, order)  # 캐시 키 생성

    # 1) 캐시 조회
    try:
        cached = redis_client.get(key)
        if cached:
            return json.loads(cached)  # 캐시 있으면 바로 반환
    except Exception:
        cached = None  # Redis 장애 시 캐시 무시

    # 2) Mongo 조회
    content, total_pages = _sort_and_page(query, page, size, order)
    result = {"content": content, "number": page, "totalPages": total_pages}

    # 3) 캐시에 저장
    try:
        redis_client.setex(key, CACHE_TTL, json.dumps(result))  # TTL 적용 저장
    except Exception:
        pass  # 저장 실패 시 무시

    return result

# ==========================
# Flask 라우트
# ==========================
@app.route("/")
def index():
    """
    서버 상태 확인용 라우트.
    - 응답: "Flask API is running"
    """
    return "Flask API is running"

@app.route("/news")
def get_news():
    """
    카테고리별 최신 뉴스 목록 API.
    - 쿼리 파라미터: category, page, size, order
    - Redis 캐시 사용 (1분)
    - 응답: {"content": [...], "number": page, "totalPages": total_pages}
    """
    category = unquote(request.args.get("category", ""))  # 카테고리 (URL 디코딩)
    page = int(request.args.get("page", 0))  # 페이지 번호
    size = int(request.args.get("size", 5))  # 페이지당 개수
    order = request.args.get("order", "desc")  # 정렬 방향

    query = {"category": category} if category else {}  # 카테고리 조건

    result = get_news_with_cache("news", category, page, size, order, query)
    return jsonify(result)

@app.route("/news/search")
def search_news():
    """
    키워드 검색 + 카테고리 필터 API.
    - 쿼리 파라미터: q, category, page, size, order
    - MongoDB에서 제목/본문/작성자/언론사에서 검색
    - 응답: {"content": [...], "number": page, "totalPages": total_pages}
    """
    q = request.args.get("q", "").strip()  # 검색어
    category = unquote(request.args.get("category", ""))  # 카테고리
    page = int(request.args.get("page", 0))  # 페이지 번호
    size = int(request.args.get("size", 5))  # 페이지당 개수
    order = request.args.get("order", "desc")  # 정렬 방향

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0})  # 검색어 없으면 빈 결과

    regex = {"$regex": q, "$options": "i"}  # 대소문자 무시 정규식

    or_query = {
        "$or": [
            {"title": regex},  # 제목 검색
            {"content": regex},  # 본문 검색
            {"author": regex},  # 작성자 검색
            {"media": regex},  # 언론사 검색
        ]
    }

    if category:
        query = {"$and": [{"category": category}, or_query]}  # 카테고리 + 검색
    else:
        query = or_query  # 검색만

    content, total_pages = _sort_and_page(query, page, size, order)
    return jsonify({"content": content, "number": page, "totalPages": total_pages})

# ==========================
# 크롤러 실행 스레드
# ==========================
def run_crawler():
    """
    백그라운드 스레드에서 주기적으로 크롤러 실행 및 오래된 뉴스 정리.
    - 1시간마다 crawler.main() 실행
    - 실행 후 30일 지난 뉴스 삭제
    - 무한 루프
    """
    while True:
        asyncio.run(crawler.task_korea_crawling())  # 비동기 크롤러 실행
        delete_old_news(30)  # 30일 지난 뉴스 삭제
        time.sleep(3600)  # 1시간 대기

# ==========================
# 엔트리 포인트
# ==========================
if __name__ == "__main__":
    """
    서버 시작 시점:
    - 백그라운드 스레드에서 run_crawler() 실행 (데몬)
    - Flask 서버 구동 (PORT 환경변수 또는 기본 8585)
    - debug=False: 운영 환경
    """
    threading.Thread(target=run_crawler, daemon=True).start()  # 백그라운드 크롤러
    port = int(os.environ.get("PORT", 8585))  # 포트 설정
    app.run(host="0.0.0.0", port=port, debug=False)  # 서버 실행
