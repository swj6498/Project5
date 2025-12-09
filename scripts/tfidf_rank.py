import re
import sys
import json
import io
import traceback
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# UTF-8 강제
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

STOPWORDS = {"그리고", "하지만", "관련", "최근", "대한", "등"}

def tokenize(text: str):
    print(f"[DEBUG] Input: {text}", file=sys.stderr)

    text = re.sub(r"[^\w가-힣]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        print("[DEBUG] Empty after cleaning", file=sys.stderr)
        return ""

    tokens = []
    words = text.split()
    for word in words:
        if len(word) > 0 and word not in STOPWORDS:
            tokens.append(word.lower())

    for i in range(len(text)):
        if "가" <= text[i] <= "힣":
            tokens.append(text[i])
            if i + 1 < len(text) and "가" <= text[i + 1] <= "힣":
                tokens.append(text[i : i + 2])

    for word in words:
        if word.isalpha() and len(word) >= 2:
            tokens.append(word.upper())

    tokens = list(set([t for t in tokens if t not in STOPWORDS and len(t) > 0]))
    result = " ".join(tokens)
    print(f"[DEBUG] Tokens: {tokens}", file=sys.stderr)
    return result

def main():
    try:
        print("[PYTHON] START", file=sys.stderr)
        raw = sys.stdin.read().strip()
        print(f"[PYTHON] RAW: {raw}", file=sys.stderr)

        data = json.loads(raw)
        query = data["query"]
        documents = data["documents"]

        print(f"[PYTHON] QUERY: {query}", file=sys.stderr)
        print(f"[PYTHON] DOCS: {len(documents)}", file=sys.stderr)

        query_tokens = tokenize(query)
        if not query_tokens:
            print("[PYTHON] Empty query tokens - returning empty", file=sys.stderr)
            print(json.dumps({"ranked_docs": []}, ensure_ascii=False))
            return

        doc_tokens = []
        for i, doc in enumerate(documents):
            doc_text = tokenize(doc["title"] + " " + doc["content"])
            doc_tokens.append(doc_text)
            print(f"[PYTHON] DOC{i}: {doc_text[:50]}...", file=sys.stderr)

        all_texts = [query_tokens] + doc_tokens
        vectorizer = TfidfVectorizer(
            max_features=1000,
            lowercase=False,
            token_pattern=r"\S+",
            min_df=1,
        )

        tfidf_matrix = vectorizer.fit_transform(all_texts)
        query_vec = tfidf_matrix[0:1]
        doc_vecs = tfidf_matrix[1:]

        doc_scores = cosine_similarity(query_vec, doc_vecs)[0]

        ranked_docs = []
        for i, score in enumerate(doc_scores):
            ranked_docs.append(
                {
                    "id": documents[i]["id"],
                    "title": documents[i]["title"],
                    "content": documents[i]["content"],
                    "score": float(score),
                }
            )

        ranked_docs.sort(key=lambda x: x["score"], reverse=True)
        result = {"ranked_docs": ranked_docs[:10]}
        print(json.dumps(result, ensure_ascii=False))
        print("[PYTHON] SUCCESS", file=sys.stderr)

    except Exception as e:
        print(f"[PYTHON] ERROR: {str(e)}", file=sys.stderr)
        print(f"[PYTHON] TRACEBACK: {traceback.format_exc()}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
