# scripts/news_terms_builder.py
import os
import re
from collections import Counter, defaultdict
from dotenv import load_dotenv
from pymongo import MongoClient
from konlpy.tag import Okt

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["stock"]
news = db["news_crawling"]
news_terms = db["news_terms"]

CATEGORIES = ["금융","증권","산업/재계","중기/벤처","글로벌 경제","생활경제","경제 일반"]

def load_stopwords() -> set:
    """scripts/stopwords_kor.txt 로드"""
    file_path = "stopwords_kor.txt"
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            stopwords = set()
            for line in f:
                word = line.strip()
                if word and re.match('^[가-힣]+$', word):
                    stopwords.add(word)
        print(f"✅ 불용어 로드 완료: {len(stopwords)}개")
        return stopwords
    except Exception as e:
        print(f"❌ 불용어 로드 실패: {e}")
        return {"있다", "있는", "하다", "되는", "밝혔다", "기자"}

def extract_nouns_kor(text: str, stopwords: set) -> list[str]:
    """Okt + 불용어 제거로 고품질 명사 추출"""
    if not text or len(text.strip()) < 2:
        return []
    
    okt = Okt()
    try:
        nouns = okt.nouns(text)
        filtered_nouns = [
            noun for noun in nouns 
            if (len(noun) >= 2 and 
                re.match('^[가-힣]+$', noun) and 
                noun not in stopwords)
        ]
        return filtered_nouns
    except Exception as e:
        print(f"⚠️ 형태소 분석 실패: {e}")
        words = re.findall(r'[가-힣]{2,}', text)
        return [w for w in words if w not in stopwords]

def build_news_terms(limit_docs: int = None, top_n: int = 5000, skip_docs: int = 0):
    """전체/부분/증분 문서 처리"""
    print(f"🚀 처리 시작: skip={skip_docs}, limit={limit_docs}, top_n={top_n}")
    
    stopwords = load_stopwords()
    
    # 전체 대상 문서 수 확인
    total_target = news.count_documents({"category": {"$in": CATEGORIES}})
    print(f"📊 전체 대상 문서: {total_target}개")
    
    query = {"category": {"$in": CATEGORIES}}
    projection = {"title": 1, "content": 1, "category": 1}
    
    cursor = news.find(query, projection)
    if skip_docs > 0:
        cursor = cursor.skip(skip_docs)
    if limit_docs:
        cursor = cursor.limit(limit_docs)
    
    cursor.batch_size = 1000  # 성능 최적화

    total_docs = 0
    total_counter = Counter()
    category_counters = defaultdict(Counter)
    sample_nouns = set()

    for i, doc in enumerate(cursor):
        title = doc.get("title", "")
        content = doc.get("content", "")
        cat = doc.get("category", "")
        
        if cat not in CATEGORIES:
            continue

        text = f"{title} {content}".strip()
        nouns = extract_nouns_kor(text, stopwords)
        
        if nouns:
            total_counter.update(nouns)
            category_counters[cat].update(nouns)
            total_docs += 1
            
            if i < 10:
                sample_nouns.update(nouns[:5])

    print(f"📊 처리된 문서: {total_docs}개")
    print(f"📊 추출된 고유 용어: {len(total_counter)}개")
    print(f"📋 샘플 명사: {sorted(list(sample_nouns))[:10]}")
    
    # 기존 데이터 삭제
    news_terms.delete_many({})
    
    docs = []
    for term, freq in total_counter.most_common(top_n):
        cat_freqs = {}
        for cat in CATEGORIES:
            f = category_counters[cat][term]
            if f > 0:
                cat_freqs[cat] = int(f)

        top_category = max(cat_freqs, key=cat_freqs.get, default=None) if cat_freqs else None

        docs.append({
            "term": term,
            "freq": int(freq),
            "categories": cat_freqs,
            "top_category": top_category,
            "source": "news_crawling",
        })

    if docs:
        result = news_terms.insert_many(docs)
        print(f"✅ news_terms 저장 완료: {len(docs)}개")
        print(f"🎯 1위: {docs[0]['term']} ({docs[0]['freq']}회)")
        print(f"🎯 2위: {docs[1]['term']} ({docs[1]['freq']}회)")
        print(f"🎯 10위: {docs[9]['term']} ({docs[9]['freq']}회)")
    else:
        print("❌ 저장할 데이터가 없습니다.")

if __name__ == "__main__":
    
    #  전체 문서 처리 (추천!)
    build_news_terms(limit_docs=None, top_n=30000)
    
