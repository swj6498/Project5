# search_engine.py
from flask import Flask, request, jsonify
from konlpy.tag import Mecab
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

app = Flask(__name__)

# Mecab 초기화 (윈도우면 mecab-ko-dic 설치 필요)
mecab = Mecab()

# 모든 종목 데이터 로드 (너가 크롤링한 JSON)
with open('stocks.json', 'r', encoding='utf-8') as f:
    STOCKS = json.load(f)  # [{"name": "삼성전자", "code": "005930", ...}, ...]

# 초성 추출 함수
def extract_initials(text):
    CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
    JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
    
    result = ""
    for char in text:
        if '가' <= char <= '힣':
            code = ord(char) - ord('가')
            cho = code // (21 * 28)
            jung = (code // 28) % 21
            jong = code % 28
            result += CHO[cho]
            if jung > 0: result += JUNG[jung]
            if jong > 0: result += JONG[jong]
        else:
            result += char
    return result

# 종목 전처리
def preprocess_stocks():
    for stock in STOCKS:
        name = stock['name']
        # 1. 띄어쓰기 제거
        stock['norm_name'] = re.sub(r'\s+', '', name)
        # 2. 초성
        stock['initials'] = extract_initials(name)
        # 3. 형태소 분석
        stock['tokens'] = ' '.join(mecab.morphs(name))
        # 4. 전체 검색용 텍스트
        stock['search_text'] = f"{name} {stock['norm_name']} {stock['initials']} {stock['tokens']} {stock['code']}"

preprocess_stocks()

# TF-IDF 벡터라이저 (한 번만 생성)
vectorizer = TfidfVectorizer(analyzer='word', ngram_range=(1,2))
tfidf_matrix = vectorizer.fit_transform([s['search_text'] for s in STOCKS])

@app.route('/api/search')
def search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify(STOCKS[:100])

    # 쿼리 전처리
    q_norm = re.sub(r'\s+', '', query)
    q_initials = extract_initials(query)
    q_tokens = ' '.join(mecab.morphs(query))
    q_text = f"{query} {q_norm} {q_initials} {q_tokens}"

    # 1. 완전 일치 먼저 체크
    exact_matches = []
    for stock in STOCKS:
        if (query.lower() in stock['name'].lower() or
            query == stock['code'] or
            q_norm in stock['norm_name'] or
            query in stock['initials'] or
            query in stock['code']):
            exact_matches.append(stock)

    if exact_matches:
        # 정확도 순 정렬
        exact_matches.sort(key=lambda x: (
            x['code'] != query,  # 코드 정확 일치 최우선
            x['name'] != query,  # 이름 정확 일치
            x['norm_name'] != q_norm,
            -len(x['name'])  # 짧을수록 위로
        ))
        return jsonify(exact_matches[:50])

    # 2. TF-IDF 유사도 검색
    q_vec = vectorizer.transform([q_text])
    similarities = cosine_similarity(q_vec, tfidf_matrix).flatten()
    
    # 상위 50개
    top_indices = np.argsort(similarities)[::-1][:50]
    results = [STOCKS[i] for i in top_indices if similarities[i] > 0.05]

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
