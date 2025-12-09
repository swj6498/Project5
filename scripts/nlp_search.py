import re
import sys
import json
import io

# UTF-8 강제
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

STOPWORDS = {"그리고", "하지만", "관련", "최근", "대한"}

def enhanced_tokenize(text: str):
    text = re.sub(r"[^0-9A-Za-z가-힣]", " ", text)
    tokens = text.split()
    tokens = [t.rstrip("의가을를이야로으로부터에") for t in tokens]
    tokens = [t for t in tokens if t and t not in STOPWORDS and len(t) > 1]
    return tokens

def main():
    raw = sys.stdin.read()
    print("RAW:", raw, file=sys.stderr)

    data = json.loads(raw)
    query = data["query"]
    print("QUERY:", query, file=sys.stderr)

    tokens = enhanced_tokenize(query)
    print("TOKENS:", tokens, file=sys.stderr)

    result = {"tokens": tokens}
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
