# C:/dev/work_springboot/Project5/scripts/tfidf_rank_lib.py
from typing import List, Dict, Any
import re
import time

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

STOPWORDS = {
    "그리고", "하지만", "관련", "최근", "대한", "등",
    "기자", "사진", "뉴스", "보도",
    "서울", "중구", "서울=연합뉴스", "서울=뉴스1",
    "연합뉴스", "뉴스1", "이데일리", "머니투데이", "전자신문", "서울경제",
    "한국경제", "조선일보", "중앙일보", "동아일보",
}

MIN_SCORE = 0.05
TITLE_BONUS = 0.05   # 기본 가산점 (강화 로직에서는 따로 계산됨)


def tokenize(text: str) -> str:
    text = re.sub(r"[^\w가-힣]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return ""

    tokens = []
    words = text.split()

    def is_noise(w: str) -> bool:
        if w.isdigit():
            return True
        if re.fullmatch(r"\d{4}년|\d{1,2}월|\d{1,2}일", w):
            return True
        if re.fullmatch(r"\d{1,2}시|\d{1,2}분|\d{1,2}초", w):
            return True
        if len(w) == 1:
            return True
        return False

    for word in words:
        if not word:
            continue
        if is_noise(word):
            continue
        if word in STOPWORDS:
            continue
        tokens.append(word.lower())

    for i in range(len(text)):
        if "가" <= text[i] <= "힣":
            unigram = text[i]
            if unigram not in STOPWORDS:
                tokens.append(unigram)
            if i + 1 < len(text) and "가" <= text[i + 1] <= "힣":
                bigram = text[i : i + 2]
                if bigram not in STOPWORDS:
                    tokens.append(bigram)

    for word in words:
        if word.isalpha() and len(word) >= 2 and word not in STOPWORDS:
            tokens.append(word.upper())

    tokens = list(set([t for t in tokens if t not in STOPWORDS and len(t) > 1]))
    return " ".join(tokens)



# ==================================================================
# 🔥 TF-IDF + 제목/본문 가중치 강화 + 근접도(Proximity) 강화 모델 적용
# ==================================================================
def rank_with_tfidf(query: str, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    start_time = time.time()
    print(f"[TFIDF] START query='{query}', docs={len(documents)}", flush=True)

    query_tokens_str = tokenize(query)
    if not query_tokens_str:
        print("[TFIDF] query_tokens empty → return []", flush=True)
        return []

    query_tokens = set(query_tokens_str.split())
    print(f"[TFIDF] query_tokens={list(query_tokens)}", flush=True)

    doc_tokens = [
        tokenize(d.get("title", "") + " " + d.get("content", ""))
        for d in documents
    ]

    all_texts = [query_tokens_str] + doc_tokens

    vectorizer = TfidfVectorizer(
        max_features=1000,
        lowercase=False,
        token_pattern=r"\S+",
        min_df=1,
    )

    tfidf_start = time.time()
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    query_vec = tfidf_matrix[0:1]
    doc_vecs = tfidf_matrix[1:]
    scores = cosine_similarity(query_vec, doc_vecs)[0]
    tfidf_end = time.time()

    print(f"[TFIDF] vectorize+cosine time={tfidf_end - tfidf_start:.4f}s", flush=True)

    ranked: List[Dict[str, Any]] = []
    q_lower = query.lower()

    # ==================================================================
    # 🔥 본격 점수 계산
    # ==================================================================
    for i, base_score in enumerate(scores):
        doc = documents[i]
        title = doc.get("title", "") or ""
        content = doc.get("content", "") or ""

        title_lower = title.lower()
        content_lower = content.lower()

        # ---------------------------------
        # 0) TF-IDF 비중 강화
        # ---------------------------------
        score = float(base_score) * 1.4   # 기본점수보다 더 강하게


        # ---------------------------------
        # 1) 제목 위치 기반 가중치 (강화)
        # ---------------------------------
        pos_title = title_lower.find(q_lower)
        if pos_title != -1:
            title_pos_score = max(0.05, 0.20 * (1 - pos_title / max(len(title_lower), 1)))
        else:
            title_pos_score = 0

        score += title_pos_score


        # ---------------------------------
        # 2) 본문 위치 기반 가중치 (본문 가중치도 강화)
        # ---------------------------------
        pos_content = content_lower.find(q_lower)
        if pos_content != -1:
            content_pos_score = max(0.03, 0.12 * (1 - pos_content / max(len(content_lower), 1)))
        else:
            content_pos_score = 0

        score += content_pos_score


        # ---------------------------------
        # 3) 근접도 (Proximity) — 범위 80자로 좁게, 강한 가중치
        # ---------------------------------
        positions = []
        for qt in query_tokens:
            idx = content_lower.find(qt)
            if idx != -1:
                positions.append(idx)

        proximity_score = 0
        if len(positions) >= 2:
            positions.sort()
            min_gap = min(
                positions[i+1] - positions[i]
                for i in range(len(positions)-1)
            )
            proximity_score = max(0.0, 0.15 * (1 - min_gap / 80))
        score += proximity_score


        # ---------------------------------
        # 4) threshold 필터링
        # ---------------------------------
        if score < MIN_SCORE:
            continue

        ranked.append({
            "id": doc["id"],
            "title": title,
            "content": content,
            "score": score,
        })

    ranked.sort(key=lambda x: x["score"], reverse=True)

    end_time = time.time()
    print(f"[TFIDF] DONE query='{query}', ranked={len(ranked)}, total_time={end_time - start_time:.4f}s", flush=True)

    return ranked
