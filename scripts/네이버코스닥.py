# 네이버 코스닥 시가총액 → MongoDB Atlas에 숫자는 int로 저장 + upsert
import requests
from bs4 import BeautifulSoup
import pymongo
from datetime import datetime
import time
from fake_useragent import UserAgent

# ================== MongoDB 연결 ==================
client = pymongo.MongoClient("mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/")
db = client["stock"]
collection = db["naver_kosdaq"]

# 인덱스 (이미 있으면 무시됨)
collection.create_index(
    [("code", 1), ("crawl_date", 1)],
    unique=True,
    partialFilterExpression={"code": {"$type": "string"}}
)

# ================== 크롤링 설정 ==================
ua = UserAgent()
headers = {
    "User-Agent": ua.random,
    "Referer": "https://finance.naver.com/",
    "Accept-Language": "ko-KR,ko;q=0.9"
}

def clean_number(text):
    """콤마 제거 후 int 변환 (N/A나 - 인 경우는 None 반환)"""
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return int(text.replace(",", ""))

def clean_float(text):
    """실수 변환 (필요시 사용)"""
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return float(text.replace(",", ""))

def crawl_kosdaq_page(page=1):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok=1&page={page}"
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
    except:
        return []

    soup = BeautifulSoup(res.text, "lxml")
    rows = soup.select("table.type_2 tbody tr[onmouseover]")

    data = []
    today = datetime.now().strftime("%Y-%m-%d")

    for row in rows:
        cols = row.select("td")
        if len(cols) < 10 or cols[1].get_text(strip=True) == "N/A":
            continue

        a_tag = row.select_one("a.tltle")
        if not a_tag:
            continue

        code = a_tag["href"].split("code=")[-1]
        name = a_tag.get_text(strip=True)

        item = {
            "rank": int(cols[0].get_text(strip=True)),
            "name": name,
            "code": code,
            "current_price": clean_number(cols[2].get_text(strip=True)),   # int
            "change": cols[3].get_text(strip=True),                        # 문자열 (상승/하락/보합)
            "change_rate": cols[4].get_text(strip=True),                   # 문자열 (+1.23%)
            "face_value": clean_number(cols[5].get_text(strip=True)),     # int
            "market_cap": clean_number(cols[6].get_text(strip=True)),     # 억원 → int
            "listed_shares": clean_number(cols[7].get_text(strip=True)),  # 주식수 → int
            "foreign_ratio": clean_float(cols[8].get_text(strip=True)),   # % → float
            "volume": clean_number(cols[9].get_text(strip=True)),         # 거래량 → int
            "per": clean_float(cols[10].get_text(strip=True)),            # PER → float
            "roe": clean_float(cols[11].get_text(strip=True)),            # ROE → float
            "crawl_date": today,
            "crawled_at": datetime.now()
        }
        data.append(item)

    print(f"페이지 {page:2d} → {len(data):2d}개 종목")
    return data

# ================== UPSERT 실행 ==================
today = datetime.now().strftime("%Y-%m-%d")
inserted = updated = 0

print(f"\n{'='*50}")
print(f"코스닥 시가총액 크롤링 시작 → 숫자 int 저장 + upsert")
print(f"{'='*50}\n")

for page in range(1, 41):
    items = crawl_kosdaq_page(page)
    if not items and page > 5:
        print("더 이상 데이터 없음 → 종료")
        break

    for item in items:
        result = collection.update_one(
            {"code": item["code"], "crawl_date": today},
            {"$set": item},
            upsert=True
        )
        if result.upserted_id:
            inserted += 1
        if result.modified_count:
            updated += 1

    time.sleep(1.0)

print(f"\n성공! 오늘 코스닥 데이터 저장 완료")
print(f"   신규 삽입: {inserted}개")
print(f"   업데이트: {updated}개")
print(f"   총 종목: {inserted + updated}개")
print(f"   저장 위치: {collection.full_name}")
