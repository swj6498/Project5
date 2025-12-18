# StockNews 🚀

[![개발 기간](https://img.shields.io/badge/개발%20기간-2025.12.02%20~%202025.12.16-blue?style=flat-square)]
[![팀원 수](https://img.shields.io/badge/팀원-6명-green?style=flat-square)]

<img src="https://github.com/user-attachments/assets/1231967b-c1d3-4f0e-8ad4-81def337bf63" alt="프로젝트 메인 대시보드 스크린샷" />

## 프로젝트 소개

**실시간 국내 주식 시세 모니터링 웹 대시보드** 📈

이 프로젝트는 웹 크롤링 기술을 활용한 로봇이 KOSPI/KOSDAQ 종목의 실시간 시세와 국내·해외 관련 뉴스를 자동 수집하고,  
수집된 데이터들을 가공하여 사용자에게 한눈에 보여줍니다.

### 개발 기간
2025.12.02 ~ 2025.12.16

### 팀원 및 역할

| 이름   | 역할                          | GitHub                                                                 |
|--------|-------------------------------|------------------------------------------------------------------------|
| 정태규 | [팀장] 국내주식 크롤링, 실시간 대시보드 등            | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/KANASIEL) |
| 조슬미 | 국내 뉴스 크롤링, 뉴스페이지 등                  | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/jseulmi) |
| 서원희 | 해외 뉴스 크롤링, 뉴스페이지 등                  | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/wonhui29) |
| 구현서 | 로그인/회원가입, 다국어UI 등                          | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/guhyeonseo) |
| 손원주 | 검색엔진 (형태소 분석 TF-IDF랭킹 오타보정), AI요약 등 | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/swj6498) |
| 지윤정 | 검색엔진 (형태소 분석 TF-IDF랭킹), 자동완성 등        | [![GitHub](https://img.shields.io/badge/GitHub-000000?style=flat&logo=github&logoColor=white)](https://github.com/Jiyunzeng) |

## 기술 스택 🛠️

| 카테고리             | 기술                                                                                                                                 |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| 운영체제             | ![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=flat&logo=ubuntu&logoColor=white)&nbsp;![Windows 11](https://img.shields.io/badge/Windows%2011-0078D6?style=flat&logo=windows11&logoColor=white) |
| 언어                 | ![Java](https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white)&nbsp;![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)&nbsp;![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) |
| 백엔드 프레임워크    | ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=flat&logo=springboot&logoColor=white)&nbsp;![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)&nbsp;![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white) |
| 프론트엔드           | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white)&nbsp;![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)&nbsp;![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)&nbsp;![Fetch API](https://img.shields.io/badge/Fetch%20API-FF4154?style=flat&logo=javascript&logoColor=white) |
| ORM / 데이터 접근     | ![MyBatis](https://img.shields.io/badge/MyBatis-000000?style=flat&logo=mybatis&logoColor=white)                                       |
| 데이터베이스          | ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)&nbsp;![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat&logo=mongodb&logoColor=white)&nbsp;![Oracle](https://img.shields.io/badge/Oracle-F80000?style=flat&logo=oracle&logoColor=white) |
| 인증 / 보안          | ![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)&nbsp;![OAuth2](https://img.shields.io/badge/OAuth2-EB5424?style=flat&logo=open%20id&logoColor=white)&nbsp; |
| AI / 외부 API        | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)&nbsp;![Perplexity.ai](https://img.shields.io/badge/Perplexity.ai-000000?style=flat&logo=perplexity-ai&logoColor=white) ![Naver](https://img.shields.io/badge/Naver-03C75A?style=flat&logo=naver&logoColor=white)&nbsp;![Google](https://img.shields.io/badge/Google-EA4335?style=flat&logo=google&logoColor=white)&nbsp;![Kakao](https://img.shields.io/badge/Kakao-FFCD00?style=flat&logo=kakao&logoColor=black) |
| 배포 / 호스팅        | ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black)                                          |
| 개발 도구 / IDE      | ![IntelliJ IDEA](https://img.shields.io/badge/IntelliJ%20IDEA-000000?style=flat&logo=intellijidea&logoColor=white)&nbsp;![STS](https://img.shields.io/badge/Spring%20Tool%20Suite-6DB33F?style=flat&logo=spring&logoColor=white)&nbsp;![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=flat&logo=visualstudiocode&logoColor=white) |
| 형상 관리 / 협업     | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)&nbsp;![Notion](https://img.shields.io/badge/Notion-000000?style=flat&logo=notion&logoColor=white) |

## 주요 크롤링 코드 🕷️

<details>
<summary><strong>네이버 증권 KOSPI/KOSDAQ 크롤링 코드</strong></summary>

**파일명**: `crawler_krx_naver.py`  
**용도**: 네이버 증권에서 KOSPI/KOSDAQ 전 종목 시세를 매일 자동 크롤링 → MongoDB 저장 + Redis 캐시 갱신  
**자동화**: Linux(Ubuntu) crontab을 활용한 월~금 09시부터 15시30분까지 10분 간격 실행 예약
    
```python
# crawler_krx_naver.py
import requests
from bs4 import BeautifulSoup
import pymongo
import redis
from datetime import datetime
import time
import random
from pymongo import UpdateOne
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from zoneinfo import ZoneInfo

# ================== MongoDB + Redis 연결 ==================
mongo_client = pymongo.MongoClient("mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/")
db = mongo_client["stock"]
kospi_col = db["naver_kospi"]      # KOSPI 컬렉션
kosdaq_col = db["naver_kosdaq"]    # KOSDAQ 컬렉션

# Redis 연결 (캐시 무효화용)
try:
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    redis_connected = True
    print("Redis 연결 성공")
except Exception:
    r = None
    redis_connected = False
    print("Redis 미연결 → 캐시 갱신 생략")

# MongoDB code 기준 unique 인덱스 자동 생성
for col, name in [(kospi_col, "naver_kospi"), (kosdaq_col, "naver_kosdaq")]:
    if "code_1" not in col.index_information():
        col.create_index("code", unique=True, name="code_1")
        print(f"[{name}] code 인덱스 생성")
    else:
        print(f"[{name}] code 인덱스 이미 존재")

# ================== Requests Session 설정 ==================
session = requests.Session()
session.headers.update({
    "User-Agent": random.choice([
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36"
    ]),
    "Referer": "https://finance.naver.com/",
    "Accept-Language": "ko-KR,ko;q=0.9"
})

# 네트워크 오류 재시도 설정
retries = Retry(total=5, backoff_factor=1, status_forcelist=[500, 502, 503, 504, 429])
session.mount("https://", HTTPAdapter(max_retries=retries))

# ================== 데이터 정제 함수 ==================
def clean_int(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return int(text.replace(",", ""))

def clean_float(text):
    if not text or text.strip() in ["N/A", "-", ""]:
        return None
    return float(text.replace(",", ""))

# ================== 단일 페이지 크롤링 ==================
def crawl_page(sosok, page):
    url = f"https://finance.naver.com/sise/sise_market_sum.naver?sosok={sosok}&page={page}"
    try:
        res = session.get(url, timeout=12)
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "lxml")
        
        rows = soup.select("table.type_2 tbody tr[onmouseover]")
        data = []
        today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")
        
        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 12: continue
            a_tag = cols[1].find("a")
            if not a_tag: continue
                
            code = a_tag["href"].split("code=")[-1]
            data.append({
                "rank": clean_int(cols[0].get_text(strip=True)),
                "name": a_tag.get_text(strip=True),
                "code": code,
                "current_price": clean_int(cols[2].get_text(strip=True)),
                "change": cols[3].get_text(strip=True),
                "change_rate": cols[4].get_text(strip=True),
                "face_value": clean_int(cols[5].get_text(strip=True)),
                "market_cap": clean_int(cols[6].get_text(strip=True)),
                "listed_shares": clean_int(cols[7].get_text(strip=True)),
                "foreign_ratio": clean_float(cols[8].get_text(strip=True)),
                "volume": clean_int(cols[9].get_text(strip=True)),
                "per": clean_float(cols[10].get_text(strip=True)),
                "roe": clean_float(cols[11].get_text(strip=True)),
                "crawl_date": today,
                "crawled_at": datetime.now(ZoneInfo("Asia/Seoul")),
                "market": "KOSPI" if sosok == 0 else "KOSDAQ"
            })
        return data
    except Exception as e:
        print(f"[{'KOSPI' if sosok==0 else 'KOSDAQ'} {page}p] 오류: {e}")
        return []

# ================== 메인 크롤링 실행 ==================
def run_crawler():
    total_items = 0
    for market_name, sosok, collection in [
        ("KOSPI", 0, kospi_col),
        ("KOSDAQ", 1, kosdaq_col)
    ]:
        print(f"\n{market_name} 크롤링 시작...")
        all_items = []
        empty_streak = 0
        
        for page in range(1, 60):
            items = crawl_page(sosok, page)
            if not items:
                empty_streak += 1
                if empty_streak >= 3:
                    print(f"{market_name} 빈 페이지 연속 → 종료")
                    break
            else:
                empty_streak = 0
                all_items.extend(items)
            print(f" {page:2d}페이지 → {len(items):3d}개")
            time.sleep(random.uniform(0.3, 0.7))
        
        if all_items:
            ops = [UpdateOne({"code": x["code"]}, {"$set": x}, upsert=True) for x in all_items]
            result = collection.bulk_write(ops, ordered=False)
            print(f"{market_name} 저장 완료 → 삽입 {result.upserted_count}, 수정 {result.modified_count}")
            total_items += len(all_items)
    
    # Redis 캐시 무효화
    if redis_connected and r:
        deleted = r.delete("krx_kospi_list", "krx_kosdaq_list")
        print(f"Redis 캐시 갱신 완료 (삭제된 키: {deleted}개)")
    
    print(f"\n전체 크롤링 완료! 총 {total_items}개 종목 업데이트")

if __name__ == "__main__":
    start_time = time.time()
    run_crawler()
    print(f"\n소요 시간: {time.time() - start_time:.1f}초")
```

<details>
<summary><strong>네이버 국내 뉴스 크롤링 코드</strong></summary>
```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from datetime import datetime
import os

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

# -------------------------
# MongoDB 연결
# -------------------------
MONGO_URI = os.environ.get("MONGO_URI")

# 로컬 테스트할 때만 아래 주석 풀어서 사용하세요
# if not MONGO_URI:
#     MONGO_URI = "mongodb+srv://..." 

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set in crawler")

client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_crawling"]

# -------------------------
# 뉴스 카테고리별 URL
# -------------------------
CATEGORY_URLS = {
    "금융": "https://news.naver.com/breakingnews/section/101/259",
    "증권": "https://news.naver.com/breakingnews/section/101/258",
    "산업/재계": "https://news.naver.com/breakingnews/section/101/261",
    "중기/벤처": "https://news.naver.com/breakingnews/section/101/771",
    "글로벌 경제": "https://news.naver.com/breakingnews/section/101/260",
    "생활경제": "https://news.naver.com/breakingnews/section/101/310",
    "경제 일반": "https://news.naver.com/breakingnews/section/101/263",
}

HEADERS = {"User-Agent": "Mozilla/5.0"}

# -------------------------
# 로그 출력
# -------------------------
def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

# -------------------------
# URL 변환
# -------------------------
def to_pc_url(link):
    if "m.news.naver.com" in link:
        return link.replace("m.news.naver.com", "n.news.naver.com")
    return link

# -------------------------
# 뉴스 상세 크롤링
# -------------------------
async def fetch_news_detail(session, link):
    link = to_pc_url(link)
    author = content = media = mediaLogo = image_url = pubDate = ""

    try:
        headers = HEADERS.copy()
        headers.update(
            {
                "Referer": "https://news.naver.com/",
                "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            }
        )

        async with session.get(link, headers=headers, timeout=15) as resp:
            html = await resp.text()
            soup = BeautifulSoup(html, "lxml")

            # 작성자
            author_tag = soup.select_one(
                ".byline span, .byline, .article_info, .writer"
            )
            if author_tag:
                author = author_tag.get_text(strip=True)

            # 본문
            content_tag = (
                soup.select_one("#articleBodyContents")
                or soup.select_one("#dic_area")
                or soup.select_one(".news_end")
                or soup.select_one(".article_body")
            )
            if content_tag:
                for s in content_tag.select(
                    "script, style, .ad, .link_area, iframe"
                ):
                    s.decompose()
                content = content_tag.get_text(separator="\n").strip()

            # 언론사
            meta_author = soup.select_one(
                "meta[property='og:article:author'], meta[name='author']"
            )
            if meta_author and meta_author.has_attr("content"):
                media = meta_author["content"].strip()

            # 대표 이미지
            meta_image = soup.select_one("meta[property='og:image']")
            if meta_image and meta_image.has_attr("content"):
                image_url = meta_image["content"].strip()

            # 작성일
            meta_date = soup.select_one(
                'meta[property="article:published_time"]'
            )
            if meta_date and meta_date.has_attr("content"):
                pubDate = meta_date["content"].strip()
            else:
                date_tag = soup.select_one('span._ARTICLE_DATE_TIME')
                if date_tag and date_tag.has_attr("data-date-time"):
                    pubDate = date_tag["data-date-time"].strip()

            # 언론사 로고
            def first_url_from_srcset(s):
                if not s:
                    return ""
                parts = s.split(",")
                first = parts[0].strip().split(" ")[0]
                return first

            logo_tag = soup.select_one("img.media_end_head_top_logo_img")
            if logo_tag:
                for a in (
                    "src",
                    "data-src",
                    "data-original",
                    "data-lazy-src",
                    "data-srcset",
                    "srcset",
                ):
                    if logo_tag.has_attr(a):
                        val = logo_tag.get(a, "").strip()
                        if a in ("srcset", "data-srcset"):
                            val = first_url_from_srcset(val)
                        if val:
                            mediaLogo = val
                            break

            if not mediaLogo:
                pc_logo = soup.select_one(".media_end_head_top_logo img")
                if pc_logo:
                    for a in ("src", "data-src", "srcset"):
                        if pc_logo.has_attr(a):
                            val = pc_logo.get(a, "").strip()
                            if a == "srcset":
                                val = first_url_from_srcset(val)
                            if val:
                                mediaLogo = val
                                break

            if not media:
                meta_site = soup.select_one(
                    "meta[property='og:site_name']"
                )
                if meta_site and meta_site.has_attr("content"):
                    media = meta_site["content"].strip()
            if media and media.endswith("| 네이버"):
                media = media.replace("| 네이버", "").strip()

    except Exception as e:
        log(f"⚠ 뉴스 상세 크롤링 실패: {link} / Error: {e}")

    return author, content, media, mediaLogo, image_url, pubDate

# -------------------------
# 뉴스 리스트 크롤링
# -------------------------
async def fetch_news_list(session, url, max_items=1000):
    news_list = []
    try:
        async with session.get(url, headers=HEADERS, timeout=10) as resp:
            html = await resp.text()
            soup = BeautifulSoup(html, "lxml")
            items = soup.select("a.sa_text_title")

            for i, a in enumerate(items):
                if i >= max_items:
                    break
                href = a["href"]
                if href.startswith("/"):
                    href = "https://news.naver.com" + href
                title = a.get_text(strip=True)
                news_list.append({"link": href, "title": title})
    except Exception as e:
        log(f"⚠ 뉴스 리스트 크롤링 실패: {url} / Error: {e}")
    return news_list

# -------------------------
# 카테고리별 크롤링
# -------------------------
async def crawl_category(session, category, url):
    news_list = await fetch_news_list(session, url)
    tasks = []
    valid_news = []

    for news in news_list:
        if collection.find_one({"link": news["link"]}):
            log(f"[SKIP] 이미 저장됨: {news['title']}")
            continue

        tasks.append(fetch_news_detail(session, news["link"]))
        valid_news.append(news)

        # 임시 문서 삽입 (상세 크롤 후 품질검사에서 걸러질 수 있음)
        collection.update_one(
            {"link": news["link"]},
            {
                "$setOnInsert": {
                    "title": news["title"],
                    "link": news["link"],
                    "category": category,
                    "author": "",
                    "content": "",
                    "media": "",
                    "mediaLogo": "",
                    "image_url": "",
                    "pubDate": "",
                }
            },
            upsert=True,
        )

    results = await asyncio.gather(*tasks)

    for (author, content, media, mediaLogo, image_url, pubDate), news in zip(
        results, valid_news
    ):
        has_title = bool(news.get("title", "").strip())
        has_content = bool(content and content.strip())
        has_media = bool(media and media.strip())
        has_date = bool(pubDate and pubDate.strip())

        # 제목이 없거나, (본문도 없고 언론사/날짜도 없으면) 삭제
        if not has_title or (not has_content and not (has_media and has_date)):
            log(f"[DROP] 내용 부족으로 삭제: {news['title']}")
            collection.delete_one({"link": news["link"]})
            continue

        # pubDate가 비어 있으면 날짜 없는 기사라서 제거
        if not has_date:
            log(f"[DROP] 날짜 없음으로 삭제: {news['title']}")
            collection.delete_one({"link": news["link"]})
            continue

        collection.update_one(
            {"link": news["link"]},
            {
                "$set": {
                    "author": author,
                    "content": content,
                    "media": media,
                    "mediaLogo": mediaLogo,
                    "image_url": image_url,
                    "pubDate": pubDate,
                }
            },
        )

    log(f"✅ {category} 뉴스 크롤링 완료. 총 저장: {len(valid_news)}건")

    # -------------------------
    # [수정됨] 메인 실행 함수
    # 이름 변경: main -> task_korea_crawling
    # -------------------------
    async def task_korea_crawling():
        async with aiohttp.ClientSession() as session:
            for category, url in CATEGORY_URLS.items():
                log(f"=== 🇰🇷 국내 뉴스 크롤링 시작: {category} ===")
                await crawl_category(session, category, url)
            log("🎉 국내 뉴스 크롤링 전체 완료!")
    
    # 원래 있던 무한루프(periodic_crawl)와 실행부(__name__)는 삭제했습니다.
    # app.py에서 task_korea_crawling 함수만 import해서 사용합니다.

```
