// App.jsx - 최종 완성본 (App.css 완전 삭제 가능!)
import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    useLocation,
} from "react-router-dom";

// ⭐ i18n 초기화 (가장 위에서 단 1번만 실행)
import "./i18n";

import "./App.css"

import Header from "./common/Header.jsx";
import Footer from "./common/Footer.jsx";

import MainPage from "./pages/Main/MainPage.jsx";
import NewsMain from "./pages/NewsPage/NewsMain.jsx";
import KrxList from "./pages/Stock/KrxList.jsx";
import KrxDetail from "./pages/Stock/KrxDetail.jsx";

import KakaoLogin from "./pages/Login/KakaoLogin.jsx";
import Login from "./pages/Login/Login.jsx";
import NaverLogin from "./pages/Login/NaverLogin.jsx";
import NaverCallback from "./pages/Login/NaverCallback.jsx";
import GoogleLogin from "./pages/Login/GoogleLogin.jsx";
import CustomGoogleButton from "./pages/Login/CustomGoogleButton.jsx";
import CustomNaverButton from "./pages/Login/CustomNaverButton.jsx";
import Register from "./pages/Register/Register.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Mypage from "./pages/Mypage/Mypage.jsx";
import UpdateMypage from "./pages/Mypage/UpdateMypage.jsx";

import About from "./common/About.jsx";

import { AuthProvider } from "./context/AuthContext";

import CustomSelect from "./common/CustomSelect.jsx";

function Layout() {
    const location = useLocation();
    const isMainPage = location.pathname === "/";
    const isLogin = location.pathname === "/login";
    const isRegister = location.pathname === "/register";
    const isMypage = location.pathname === "/mypage";

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                background: (isMainPage || isLogin || isRegister)
                    ? "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3b82f6 100%) fixed"
                    : isMypage
                    ? "#f5f7fa"
                    : "#ffffff",

                backgroundAttachment: (isMainPage || isLogin || isRegister) ? "fixed" : "static",
                color: (isMainPage || isLogin || isRegister) ? "white" : "#222222",
            }}
        >
            <Header />

            <main
                style={{
                    flex: 1,
                    ...(isMainPage
                        ? {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "80px 20px",
                        }
                        : {
                            padding: "100px 20px 120px",
                            minHeight: "calc(100vh - 220px)",
                        }),
                }}
            >
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/krx/list" element={<KrxList />} />
                    <Route path="/krx/:code" element={<KrxDetail />} />
                    <Route path="/news" element={<NewsMain />} />
                    <Route path="/kakaoLogin" element={<KakaoLogin />} />
                    <Route path="/naverLogin" element={<NaverLogin />} />
                    <Route path="/googleLogin" element={<GoogleLogin />} />
                    <Route path="/customGoogleButton" element={<CustomGoogleButton />} />
                    <Route path="/login/naver/callback" element={<NaverCallback />} />
                    <Route path="/customNaverButton" element={<CustomNaverButton />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/mypage" element={<Mypage />} />
                    <Route path="/updateMypage" element={<UpdateMypage />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </main>

            <Footer />
        </div>
    );
}

function App() {
    return (
        <GoogleOAuthProvider clientId="925554401773-fojodmg8ktecqu8g8usn87ifkh78fafc.apps.googleusercontent.com">
            <AuthProvider>
                <Router>
                    <Layout />
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
