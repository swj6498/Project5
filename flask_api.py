from flask import Flask, jsonify, request
from flask_cors import CORS
from urllib.parse import unquote
from datetime import datetime
import threading, time, os, asyncio
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

import scripts.naver_news_crawler as crawler

app = Flask(__name__)
CORS(app)

# MongoDB 연결
MONGO_URI = os.environ.get("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in Flask")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]

# 🔥 TF-IDF 전역 변수
global_vectorizer = None
global_feature_names = None

# ✅ 정규식 명사 추출 패턴 (삼성전자, 반도체, 주가상승 등)
KOREAN_NOUN_PATTERN = re.compile(r'(?:[가-힣]{2,4})(?:[가-힣\s]+[가-힣]{2,4})?')


def preprocess_text(text):
    if not text:
        return ""
    text = re.sub(r"[^\w\s가-힣]", " ", text)
    return text.strip()


def tokenize_korean(text):
    if not text:
        return []
    text = preprocess_text(text)
    # ❌ 짧은 검색어(삼성 등)도 허용하기 위해 길이 제한 제거

    # ✅ 정규식으로 명사 추출 (Render 호환)
    nouns = KOREAN_NOUN_PATTERN.findall(text)
    stopwords = {
        "기자", "사진", "연합뉴스", "매일경제", "중앙일보", "조선비즈",
        "출처", "입력", "수정", "대한", "뉴스", "시간", "지난", "이번",
    }
    tokens = [t.strip() for t in nouns if t.strip() not in stopwords and len(t.strip()) > 1]
    return tokens[:100]


def query_to_tfidf_vector(query, vectorizer, feature_names):
    """검색 쿼리를 TF-IDF 벡터로 변환"""
    if vectorizer is None or feature_names is None:
        return None

    query_tokens = tokenize_korean(query)
    # 토큰이 하나도 안 나오면 쿼리 단어 그대로라도 사용
    if not query_tokens and query.strip():
        query_tokens = [query.strip()]

    if not query_tokens:
        return None

    query_text = " ".join(query_tokens)
    query_vec = vectorizer.transform([query_text])
    return query_vec.toarray()[0]


@app.route("/")
def index():
    return "Flask API is running (TF-IDF 검색 엔진 - Render 호환)"


@app.route("/news")
def get_news():
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    query = {"category": category} if category else {}
    news_list = list(collection.find(query, {"_id": 0}))

    for news in news_list:
        try:
            news["pubDate"] = datetime.strptime(
                news.get("pubDate", "1970-01-01 00:00:00"),
                "%Y-%m-%d %H:%M:%S",
            )
        except Exception:
            news["pubDate"] = datetime(1970, 1, 1)

    reverse = (order != "asc")
    news_list.sort(key=lambda x: x["pubDate"], reverse=reverse)

    start = page * size
    end = start + size
    content = news_list[start:end]

    for news in content:
        news["pubDate"] = news["pubDate"].strftime("%Y-%m-%d %H:%M:%S")

    return jsonify(
        {
            "content": content,
            "number": page,
            "totalPages": (len(news_list) + size - 1) // size,
        }
    )


@app.route("/news/search")
def search_news():
    global global_vectorizer, global_feature_names

    q = request.args.get("q", "").strip()
    category = unquote(request.args.get("category", ""))
    page = int(request.args.get("page", 0))
    size = int(request.args.get("size", 5))
    order = request.args.get("order", "desc")

    print(f"🔍 TF-IDF 검색: '{q}' (category: {category})")

    if not q:
        return jsonify({"content": [], "number": 0, "totalPages": 0, "totalElements": 0})

    # tfidf 필드가 있는 문서만 후보
    candidate_query = {
        # "tfidf": {"$exists": True},
        "content": {"$ne": ""},
    }
    if category:
        candidate_query["category"] = category

    candidates = list(
        collection.find(candidate_query, {"_id": 0})
        .sort("pubDate", -1)
        .limit(1000)
    )
    print(f"📊 후보 문서: {len(candidates)}개")

    if not candidates:
        return jsonify({"content": [], "number": 0, "totalPages": 0, "totalElements": 0})

    # ✅ 처음 한 번만 벡터라이저 학습
    if global_vectorizer is None or global_feature_names is None:
        token_texts = [
            " ".join(doc.get("tokens", []))
            for doc in candidates
            if doc.get("tokens")
        ]
        if token_texts:
            # 🔧 min_df=1 로 완화: 한 번만 나와도 vocabulary에 포함
            global_vectorizer = TfidfVectorizer(max_features=5000, min_df=1)
            global_vectorizer.fit(token_texts)
            global_feature_names = global_vectorizer.get_feature_names_out()
            print(f"✅ TF-IDF Vectorizer 학습 완료: {len(global_feature_names)}개 용어")
        else:
            # tokens 자체가 없으면 검색 불가
            return jsonify({"content": [], "number": 0, "totalPages": 0, "totalElements": 0})

    query_vec = query_to_tfidf_vector(q, global_vectorizer, global_feature_names)
    if query_vec is None:
        print("⚠️ 쿼리 토큰화 실패 - 정규식 검색 폴백 불가")
        return jsonify({"content": [], "number": 0, "totalPages": 0, "totalElements": 0})

    scores = []
    for doc in candidates:
        doc_tfidf = doc.get("tfidf", {})
        if not doc_tfidf:
            continue

        # 전역 vocabulary 순서에 맞는 벡터 생성
        doc_vec = np.zeros(len(global_feature_names))
        for term, weight in doc_tfidf.items():
            idx = np.where(global_feature_names == term)[0]
            if len(idx) > 0:
                doc_vec[idx[0]] = weight

        similarity = cosine_similarity([query_vec], [doc_vec])[0][0]
        # 🔧 일단 0 이상은 모두 남겨서 결과 확인 (나중에 0.02~0.05 등으로 조정)
        if similarity >= 0.0:
            doc["similarity"] = float(similarity)
            scores.append(doc)

    if scores:
        print(
            f"✅ 유사도 계산 완료: {len(scores)}개 문서 "
            f"(평균: {np.mean([s['similarity'] for s in scores]):.3f})"
        )
    else:
        print("⚠️ 유사도 0 이상 문서 없음")

    # similarity + pubDate 정렬
    def parse_date_safe(v):
        try:
            return datetime.strptime(v, "%Y-%m-%d %H:%M:%S")
        except Exception:
            return datetime.min

    scores.sort(
        key=lambda x: (x.get("similarity", 0.0), parse_date_safe(x.get("pubDate", "1970-01-01 00:00:00"))),
        reverse=True,
    )

    start = page * size
    end = start + size
    content = scores[start:end]

    for news in content:
        try:
            news["pubDate"] = datetime.strptime(
                news.get("pubDate", "1970-01-01 00:00:00"),
                "%Y-%m-%d %H:%M:%S",
            ).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            news["pubDate"] = "1970-01-01 00:00:00"
        # 프론트에는 내부 토큰/벡터는 숨김
        news.pop("tokens", None)
        news.pop("tfidf", None)

    return jsonify(
        {
            "content": content,
            "number": page,
            "totalPages": (len(scores) + size - 1) // size,
            "totalElements": len(scores),
        }
    )


def run_crawler():
    while True:
        asyncio.run(crawler.main())
        time.sleep(3600)


if __name__ == "__main__":
    threading.Thread(target=run_crawler, daemon=True).start()
    port = int(os.environ.get("PORT", 8585))
    app.run(host="0.0.0.0", port=port, debug=True)

