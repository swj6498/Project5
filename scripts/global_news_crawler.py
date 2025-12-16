import asyncio
import aiohttp
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import datetime
import os
import requests
import re
import redis
import json

# =========================
# MongoDB
# =========================
MONGO_URI = os.environ.get("MONGO_URI")
client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
db = client["stock"]
collection = db["news_global"]

# =========================
# Redis
# =========================
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL, decode_responses=True)
CACHE_TTL = 300  # 5분

REDIS_KEY_GLOBAL_LATEST = "global:news:latest"

# =========================
# 미디어 로고
# =========================
MEDIA_LOGOS = {
    "CNBC": "https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg",
    "CNN": "https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg",
    "BBC": "https://upload.wikimedia.org/wikipedia/commons/b/bc/BBC_News_2022.svg",
    "Yahoo Finance": "https://s.yimg.com/cv/apiv2/default/logo_yahoo_finance.png"
}

DEFAULT_IMAGE = "https://via.placeholder.com/400x220?text=No+Image"

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept-Language": "en-US,en;q=0.9",
}

CNN_RSS_URLS = [
    "http://rss.cnn.com/rss/money_latest.rss",
    "http://rss.cnn.com/rss/world.rss",
    "http://rss.cnn.com/rss/edition_business.rss",
    "http://rss.cnn.com/rss/edition_technology.rss",
]

# =========================
# RSS Fetch
# =========================
async def fetch_rss(session, url):
    async with session.get(url, headers=HEADERS, timeout=20) as res:
        text = await res.text()
        return BeautifulSoup(text, "xml")

# =========================
# 기사 상세
# =========================
async def get_article_detail(session, url, source):
    try:
        async with session.get(url, headers=HEADERS, timeout=10) as res:
            if res.status != 200:
                return "", "", None

            soup = BeautifulSoup(await res.text(), "html.parser")

            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()

            paragraphs = soup.select("p")
            content = "\n".join(
                p.get_text(strip=True)
                for p in paragraphs
                if len(p.get_text(strip=True)) > 30
            )

            og = soup.select_one("meta[property='og:image']")
            image_url = og.get("content") if og else ""

            author = extract_author(soup, source)
            return content, image_url, author

    except:
        return "", "", None

# =========================
# 작성자
# =========================
def extract_author(soup, source):
    try:
        if source == "CNBC":
            tag = soup.select_one(".ArticleHeader-author a")
        elif source == "CNN":
            tag = soup.select_one(".byline__names")
        elif source == "BBC":
            tag = soup.select_one(".ssrcss-1rv0p4l-Contributor")
        elif source == "Yahoo Finance":
            tag = soup.select_one("[data-testid='author-name']")
        else:
            tag = None
        return tag.get_text(strip=True) if tag else None
    except:
        return None

# =========================
# DB 저장
# =========================
def save_news(title, link, content, image_url, source, author):
    if collection.find_one({"link": link}):
        return

    if not image_url:
        image_url = MEDIA_LOGOS.get(source) or DEFAULT_IMAGE

    collection.insert_one({
        "title": title,
        "link": link,
        "content": content,
        "image_url": image_url,
        "source": source,
        "mediaLogo": MEDIA_LOGOS.get(source, ""),
        "author": author,
        "region": "global",
        "pubDate": datetime.datetime.utcnow(),
        "createdAt": datetime.datetime.utcnow()
    })

# =========================
# Yahoo
# =========================
def get_article_detail_yahoo(url):
    soup = BeautifulSoup(
        requests.get(url, headers=HEADERS, timeout=10).text,
        "html.parser"
    )
    content = "\n".join(
        p.get_text(strip=True)
        for p in soup.select("p")
        if len(p.get_text(strip=True)) > 20
    )
    og = soup.select_one("meta[property='og:image']")
    return content, og.get("content") if og else "", extract_author(soup, "Yahoo Finance")

async def crawl_yahoo(session):
    soup = await fetch_rss(session, "https://finance.yahoo.com/rss/topstories")
    loop = asyncio.get_running_loop()

    for item in soup.find_all("item")[:30]:
        title = item.title.text.strip()
        link = item.link.text.strip()

        content, img, auth = await loop.run_in_executor(
            None, get_article_detail_yahoo, link
        )

        save_news(title, link, content, img, "Yahoo Finance", auth)

# =========================
# CNN / CNBC / BBC
# =========================
async def crawl_generic(session, rss_url, source):
    soup = await fetch_rss(session, rss_url)
    for item in soup.find_all("item")[:30]:
        title = re.sub("<[^>]+>", "", item.title.text.strip())
        link = item.link.text.strip()

        content, img, auth = await get_article_detail(session, link, source)
        save_news(title, link, content, img, source, auth)

# =========================
# 🔥 Redis 캐시 생성
# =========================
def cache_global_news():
    news = list(
        collection.find({"region": "global"})
        .sort("pubDate", -1)
        .limit(200)
    )

    for n in news:
        n["_id"] = str(n["_id"])

    redis_client.setex(
        REDIS_KEY_GLOBAL_LATEST,
        CACHE_TTL,
        json.dumps(news)
    )

    print("⚡ Redis 글로벌 뉴스 캐시 갱신 완료")

# =========================
# 메인 태스크
# =========================
is_global_crawling = False

async def task_global_crawling():
    global is_global_crawling
    if is_global_crawling:
        return

    is_global_crawling = True
    try:
        async with aiohttp.ClientSession() as session:
            await asyncio.gather(
                crawl_generic(session, "https://www.cnbc.com/id/100727362/device/rss/rss.html", "CNBC"),
                crawl_generic(session, "https://feeds.bbci.co.uk/news/business/rss.xml", "BBC"),
                crawl_yahoo(session),
                return_exceptions=True
            )

        # 🔥 크롤링 끝나면 Redis 캐시 생성
        cache_global_news()

    finally:
        is_global_crawling = False

# =========================
# 🔥 화면/API용 조회 함수
# =========================
def get_global_news_fast():
    cached = redis_client.get(REDIS_KEY_GLOBAL_LATEST)
    if cached:
        return json.loads(cached)

    # fallback
    news = list(
        collection.find({"region": "global"})
        .sort("pubDate", -1)
        .limit(200)
    )

    for n in news:
        n["_id"] = str(n["_id"])

    redis_client.setex(
        REDIS_KEY_GLOBAL_LATEST,
        CACHE_TTL,
        json.dumps(news)
    )

    return news
