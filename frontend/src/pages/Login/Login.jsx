import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KakaoLogin from "./KakaoLogin";
import NaverLogin from "./NaverLogin";
import GoogleLogin from "./GoogleLogin";
import CustomNaverButton from "../../pages/Login/CustomNaverButton.jsx";
import CustomGoogleButton from "../../pages/Login/CustomGoogleButton";
import "./Login.css";
import { useTranslation } from "react-i18next";

const Login = () => {
	const { t } = useTranslation();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();  // 로그인 상태 업데이트 함수

    const [userId, setUserId] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg("");

        const loginData = {
            user_id: userId,
            user_password: userPassword,
        };

        try {
            const response = await axios.post(
                "http://localhost:8585/api/login",
                loginData,
                { withCredentials: true }
            );

            // 문자열이면 백엔드 에러 메시지
            if (typeof response.data === "string") {
                setErrorMsg(response.data);
                return;
            }

            // -------------------------------------------
            // 서버에서 온 JWT 토큰 저장
            // -------------------------------------------
			const token = response.data.token;
			const nickname = response.data.user.nickname;

            if (!token) {
                setErrorMsg("서버에서 토큰을 받지 못했습니다.");
                return;
            }

            // 1) localStorage 저장 → 새로고침해도 유지됨
            localStorage.setItem("jwtToken", token);
            localStorage.setItem("nickname", nickname);

            // 2) axios 요청 시 자동으로 Authorization 추가되도록 설정
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            // -------------------------------------------

            // 전역(context)에도 로그인 정보 업데이트
            + loginSuccess(token);

            alert("로그인 성공!");
            navigate("/");

        } catch (error) {
            console.error("로그인 오류:", error);
            setErrorMsg(t("loginFail"));
        }
    };

    return (
        <div className="login-wrapper">

            <div className="site-title-login">
                <h1>Stock & News Search</h1>
            </div>

            <div className="login-container">
                <h2 className="login-title">{t("login")}</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <div>
                        <p className="login-label">{t("id")}</p>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div>
                        <p className="login-label">{t("pw")}</p>
                        <input
                            type="password"
                            value={userPassword}
                            onChange={(e) => setUserPassword(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    {errorMsg && <p className="login-error">{errorMsg}</p>}

                    <button type="submit" className="login-btn">
                        {t("login")}
                    </button>
					
					<div class="hr-with-text">
					  <span>SNS LOGIN</span>
					</div>
					
                    <KakaoLogin />
					
                    <NaverLogin />
					<CustomNaverButton />
					
					
					<GoogleLogin />
					<CustomGoogleButton />

                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="login-register-btn"
                    >
                        {t("register")}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
