# 네이버 코스피 시가총액 → MongoDB Atlas (숫자 int/float + upsert)

import requests
from bs4 import BeautifulSoup
import pymongo
from datetime import datetime
import time
from fake_useragent import UserAgent

# ================== MongoDB 연결 ==================
client = pymongo.MongoClient("mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/")
db = client["stock"]
collection = db["naver_kospi"]        # ← 컬렉션 이름만 kospi로 변경!

# 고유 인덱스 (이미 있으면 무시됨)
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
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return int(text.replace(",", ""))

def clean_float(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return float(text.replace(",", ""))

def crawl_kospi_page(page=1):
    # 여기만 sosok=0 으로 변경! (0=코스피, 1=코스닥)
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok=0&page={page}"
    
    try:
        res = requests.get(url, headers=headers, timeout=15)
        res.raise_for_status()
    except Exception as e:
        print(f"[코스피 {page}페이지] 요청 실패 → {e}")
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
            "current_price": clean_number(cols[2].get_text(strip=True)),
            "change": cols[3].get_text(strip=True),           # 상승/하락/보합
            "change_rate": cols[4].get_text(strip=True),      # +1.23%
            "face_value": clean_number(cols[5].get_text(strip=True)),
            "market_cap": clean_number(cols[6].get_text(strip=True)),   # 억원
            "listed_shares": clean_number(cols[7].get_text(strip=True)),
            "foreign_ratio": clean_float(cols[8].get_text(strip=True)),
            "volume": clean_number(cols[9].get_text(strip=True)),
            "per": clean_float(cols[10].get_text(strip=True)),
            "roe": clean_float(cols[11].get_text(strip=True)),
            "crawl_date": today,
            "crawled_at": datetime.now()
        }
        data.append(item)

    print(f"코스피 페이지 {page:2d} → {len(data):2d}개 종목")
    return data

# ================== UPSERT 실행 (코스피) ==================
today = datetime.now().strftime("%Y-%m-%d")
inserted = updated = 0

print(f"\n{'='*60}")
print(f"        네이버 코스피 시가총액 크롤링 시작 (업서트 + 숫자 int)")
print(f"{'='*60}\n")

for page in range(1, 50):        # 코스피는 보통 18~20페이지면 끝!
    items = crawl_kospi_page(page)
    if not items and page > 5:
        print("더 이상 데이터 없음 → 크롤링 종료")
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

print(f"\n성공! 오늘 코스피 데이터 저장 완료")
print(f"   신규 삽입: {inserted}개")
print(f"   업데이트: {updated}개")
print(f"   총 종목: {inserted + updated}개")
print(f"   저장 컬렉션: {collection.full_name}")
