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
