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

1. 프로젝트 임포트후에 터미널로 frontend 폴더 안에서 npm install
2. npm run dev


- 주식데이터 뜨게하기(build.gradle) : 
스프링부트 window -> preferences -> java compiler 에서 Store information about method paremeter 체크 후 Apply
