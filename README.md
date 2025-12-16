[파이썬 패키지]
pip install requests  
pip install beautifulsoup4  
pip install lxml  
pip install pandas  
pip install pymongo  

[React 폴더 구조(예시)]  
/frontend  
├── node_modules/          (설치된 모든 라이브러리)  
├── public/                (공개 액세스 자산)  
│   ├── index.html         (진입점 HTML 파일)  
│   ├── favicon.ico  
│   └── manifest.json  
├── src/                   (핵심 작업 폴더)  
│   ├── components/        (재사용 가능한 작은 UI 요소) Ex) Header, Footer  
│   ├── pages/             (페이지 단위의 큰 컴포넌트) Ex) News.jsx , MainPage.jsx ...  
│   ├── assets/            (이미지, 폰트, 전역 CSS 등)  img/, font/, ...  
│   ├── utils/             (도우미 함수, API 호출 로직 등)  
│   ├── hooks/             (커스텀 Hook 로직)  
│   ├── App.js             (메인 루트 컴포넌트)   <--- 라우터 설정 (페이지 연결)  
│   ├── index.js           (React 앱 렌더링 시작점)  
│   └── reportWebVitals.js (성능 측정 - 기본 제공)  
├── package.json           (프로젝트 메타데이터 및 종속성)  
├── package-lock.json      (정확한 종속성 버전 잠금)  
└── README.md  


- 주식데이터 뜨게하기(build.gradle) : 
스프링부트 window -> preferences -> java compiler 에서 Store information about method paremeter 체크 후 Apply



형태소분석/랭킹/챗봇

pip install openai python-dotenv
pip install fastapi uvicorn pydantic cd C:\dev\work_springboot\Project5\scripts python fastapi_server.py

-C:\dev\work_springboot\Project5\scripts 경로에 '.env' 파일 생성

내용 : PERPLEXITY_API_KEY=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
MONGO_URI="mongodb+srv://kh:1234@cluster0.fbav0ho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

프로젝트 실행 순서

1. ubuntu: redis-server
2. (프로젝트 폴더 루트 기준) cd frontend
3. npm install
4. npm run dev
5. boot 실행
6. 터미널 추가: cd script
7. uvicorn StockSearch:app --reload
8. 터미널 추가: cd script
9. python fastapi_server.py
