import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import KakaoLogin from "./KakaoLogin";
import "./Login.css";

const Login = () => {
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();  // 🔥 여기 수정

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

            if (typeof response.data === "string") {
                setErrorMsg(response.data);
                return;
            }

            // 🔥 전역 로그인 상태에 닉네임 저장
            loginSuccess(response.data.nickname);

            alert("로그인 성공!");
            navigate("/");

        } catch (error) {
            console.error(error);
            setErrorMsg("로그인 중 오류가 발생했습니다.");
        }
    };

    return (
        <div className="login-wrapper">

            <div className="site-title-login">
                <h1>Stock & News Search</h1>
            </div>

            <div className="login-container">
                <h2 className="login-title">로그인</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <div>
                        <p className="login-label">아이디</p>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div>
                        <p className="login-label">비밀번호</p>
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
                        로그인
                    </button>

                    <KakaoLogin />

                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                        className="login-register-btn"
                    >
                        회원가입
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
