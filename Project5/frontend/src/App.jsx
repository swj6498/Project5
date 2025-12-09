// App.jsx - 최종 완성본 (App.css 완전 삭제 가능!)
import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

import Header from "./common/Header.jsx";
import Footer from "./common/Footer.jsx";

import MainPage from "./pages/Main/MainPage.jsx";
import NewsList from "./pages/NewsPage/NewsList.jsx";
import KrxList from "./pages/Stock/KrxList.jsx";
import KrxDetail from "./pages/Stock/KrxDetail.jsx";

import KakaoLogin from "./pages/Login/KakaoLogin.jsx";
import Login from "./pages/Login/Login.jsx";
import Register from "./pages/Register/Register.jsx";

import Mypage from "./pages/Mypage/Mypage.jsx";
import UpdateMypage from "./pages/Mypage/UpdateMypage.jsx";

import { AuthProvider } from "./context/AuthContext";

function Layout() {
    const location = useLocation();
    const isMainPage = location.pathname === "/";

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                // 메인페이지는 그라데이션 배경
                // 다른 페이지는 흰색 배경
                background: isMainPage
                    ? "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3b82f6 100%) fixed"
                    : "#ffffff",
                backgroundAttachment: isMainPage ? "fixed" : "static",
                color: isMainPage ? "white" : "#222222",
            }}
        >
            <Header />

            <main
                style={{
                    flex: 1,
                    // 메인페이지는 가운데 정렬 + 여백
                    ...(isMainPage
                        ? {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px 20px",
                        }
                        : // 다른 페이지는 위부터 꽉 차게 + 약간 여백
                        {
                            padding: "100px 20px 120px",
                            minHeight: "calc(100vh - 220px)",
                        }),
                }}
            >
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/krx/list" element={<KrxList />} />
                    <Route path="/krx/:code" element={<KrxDetail />} />
                    <Route path="/news" element={<NewsList />} />
                    <Route path="/kakaoLogin" element={<KakaoLogin />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/mypage" element={<Mypage />} />
                    <Route path="/updateMypage" element={<UpdateMypage />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <Router>
		<AuthProvider>
            <Layout />
		</AuthProvider>
        </Router>
    );
}

export default App;