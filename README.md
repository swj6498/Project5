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

---

## 🧭 메뉴 구조도 (PDF)

📄 메뉴 구조도 보기  
👉 [빅데이터_메뉴구조도.pdf](https://github.com/user-attachments/files/24272915/_.pdf)

---

## 🖥 화면 설계서 (PDF)

📄 화면 설계서 보기  
👉 [빅데이터_화면설계서.pdf](https://github.com/user-attachments/files/24273015/_.pdf)

---

## 🗂 ERD 및 테이블 명세서 (PDF)

📄 ERD  
</details> <details> <summary><strong>ERD 다이어그램</strong> </summary>
  
<img width="529" height="284" alt="image" src="https://github.com/user-attachments/assets/e618cd55-7e86-442d-a1a2-537b495f666e" />

</details>

📄 테이블 명세서  
➡ [빅데이터_테이블명세서.pdf](https://github.com/user-attachments/files/24273047/_.pdf)


---

## 🔍 주요 구현 기능(본인)
  
### ⚡ FastAPI 서버를 연동한 데이터 관리 및 수집
  
**파일명**: `fastapi_server.py`  
  
**용도**: MongoDB Change Stream으로 뉴스 기사 컬렉션에서 실시간으로 명사를 추출해 카테고리별 빈도 통계를 자동 집계 -> news_terms 컬렉션에 저장,
         형태소 분석/TF-IDF랭킹/오타교정/챗봇 연동

<details>
  <summary><strong> 명사 추출·분석 로직: stopwords_kor.txt(불용어) 로드, KoNLPy(Okt) 형태소 분석기 사용</strong></summary>
  
  ```python
  def load_stopwords() -> Set[str]:
      """불용어 로드"""
      file_path = "scripts/stopwords_kor.txt"  # scripts 폴더에 맞게 조정
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
          return {"있다", "있는", "하다", "되는", "밝혔다", "기자", "등", "통해", "위해"}
  
  def extract_nouns_kor(text: str, stopwords: Set[str]) -> list[str]:
      """Okt + 불용어 제거로 고품질 명사 추출"""
      if not text or len(text.strip()) < 2:
          return []
      
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
  ```
</details>

<details>
  <summary><strong> Redis 캐시(성능개선): 방식-Look-aside 캐시, pickle 직렬화 / 사용처: TF-IDF 검색 결과 캐시, 뉴스 검색 오타 교정 결과 캐시</strong></summary>

  ```python
  def get_cache(key: str):
    data = redis_client.get(key)
    return pickle.loads(data) if data else None

  def set_cache(key: str, value: Any, ttl: int):
    redis_client.setex(key, ttl, pickle.dumps(value))
  ```
</details>

<details>
  <summary><strong> News Terms Streamer (Change Stream) : MongoDB에 뉴스가 들어오면 실시간으로 용어 통계 자동 업데이트</strong></summary>

  ```python
  async def run_news_terms_stream():
    pipeline = [
        {"$match": {
            "operationType": "insert",
            "fullDocument.category": {"$in": CATEGORIES}
        }}
    ]

    async with news_collection.watch(pipeline) as stream:
        async for change in stream:
            await process_single_doc(change["fullDocument"])
  ```
</details>

  
### 📊 TF-IDF 랭킹 구현
  
  **파일명**: `tfidf_rank_lib.py`
  
  **용도**: TF-IDF 기반 뉴스 랭킹, 이를 활용한 게시물 정확도순 정렬
  
<details>
  <summary><strong> TF-IDF + 코사인 유사도 기반 점수 산출</strong></summary>

  ```python
  from sklearn.feature_extraction.text import TfidfVectorizer
  from sklearn.metrics.pairwise import cosine_similarity
  
  vectorizer = TfidfVectorizer(...)
  doc_vectors = vectorizer.fit_transform(documents)
  query_vector = vectorizer.transform([query])
  
  similarity_scores = cosine_similarity(query_vector, doc_vectors)[0]
  ```
</details>

<details>
  <summary><strong> 제목·본문을 구분한 가중치 적용</strong></summary>

  ```python
  title_score = cosine_similarity(query_vec, title_vec)[0][i]
  content_score = cosine_similarity(query_vec, content_vec)[0][i]
  
  final_score = title_score * TITLE_WEIGHT + content_score * CONTENT_WEIGHT
  ```
</details>

<details>
  <summary><strong> 키워드 포함 여부 기반 점수 보정</strong></summary>

  ```python
  if keyword in title:
    final_score += TITLE_KEYWORD_BONUS

  if keyword in content:
    final_score += CONTENT_KEYWORD_BONUS
  ```
</details>

<details>
  <summary><strong> 다중 키워드 동시 등장 고려</strong></summary>

  ```python
  match_count = sum(1 for kw in keywords if kw in content)

  if match_count >= 2:
    final_score += MULTI_KEYWORD_BONUS
  ```
</details>

  
### ✏️ 검색어 오타 교정 기능 구현
  
  **파일명**: `ime_converter.py`, `news_typo_corrector.py`
  
  **용도**: 메인의 뉴스탭 or 뉴스화면에서 검색했을 때 오타 교정 및 대체 검색어 제안

- `ime_converter.py` : 두벌식 영타 한글 변환기
- `news_typo_corrector.py` : 정확 일치 여부 우선 확인 
→ MongoDB Aggregation으로 후보 축소
→ Levenshtein 거리 + 빈도수 기반 최적 후보 선택

- 실패 시 LLM(API) 를 활용한 최종 보정 → 사용자가 오타 입력 시에도 검색 성공률 유지

<details>
  <summary><strong> Levenshtein 거리 기반 오타 판별</strong></summary>

  ```python
  dist = levenshtein(q, term)

  if dist <= 3:
      score = 1.0 / (dist + 1) + (freq / 10000.0)
  ```
</details>

<details>
  <summary><strong> Exact Match → Aggregation → LLM 단계적 파이프라인</strong></summary>

  ```python
  # 1) exact match
  news_terms.find_one({"term": q})
  
  # 2) aggregation + levenshtein
  suggest_news_terms_improved(q)
  
  # 3) llm fallback
  llm_correct_term(q)
  ```
</details>
  
### 🤖 챗봇 분석·요약 기능 구현
  
  **파일명**: `chat_summary_lib.py`
  
  **용도**: 사용자가 검색한 단어or문장이 무엇인지/주식과 어떤 연관이 있는지 정보 제공
  
- 검색어 기준으로 AI 서버에 분석 요청 → 핵심 내용 요약 결과를 UI에 표시

  
### 🚀 뉴스화면 검색 시연영상

https://github.com/user-attachments/assets/199ce594-766c-4652-a668-8d032b032778
  

