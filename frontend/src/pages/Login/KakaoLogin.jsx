import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./KakaoLogin.css";
import { useTranslation } from "react-i18next";

const KakaoLogin = () => {
	const { t } = useTranslation();
    const navigate = useNavigate();
    const { loginSuccess } = useAuth();

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://developers.kakao.com/sdk/js/kakao.js";
        script.onload = () => {
            if (!window.Kakao.isInitialized()) {
                window.Kakao.init("bf9f9907f0485f2f46de133469b6c7d1");
                console.log("Kakao SDK Initialized!");
            }
        };
        document.body.appendChild(script);
    }, []);

    const handleKakaoLogin = () => {
        window.Kakao.Auth.login({
            success: function (authObj) {
                console.log("로그인 성공:", authObj);

                window.Kakao.API.request({
                    url: "/v2/user/me",
                    success: function (res) {
                        console.log("카카오 프로필:", res);

                        const dto = {
                            kakaoId: String(res.id),
                            email: res.kakao_account?.email || null,
                            nickname: res.properties?.nickname || null,
                            profileImage: res.properties?.profile_image || null
                        };

                        axios.post(
                            "http://localhost:8585/api/auth/loginOrRegister",
                            dto
                        )
                            .then(result => {
                                console.log("서버 응답:", result.data);

                                const { token } = result.data;

                                // ⭐ JWT 저장
                                localStorage.setItem("token", token);

                                // ⭐ 전역 로그인 상태 변경
                                loginSuccess(token);
								localStorage.setItem("jwtToken", result.data.token);
								localStorage.setItem("nickname", result.data.user.nickname);

                                alert("로그인 성공!");
                                navigate("/");
                            })
                            .catch(err => {
                                console.error("서버 오류:", err);
                            });
                    }
                });
            },
            fail: function (err) {
                console.log("로그인 실패:", err);
            }
        });
    };

    return (
        <button className="kakao-btn" onClick={handleKakaoLogin}>
            {t("loginKakao")}
        </button>
    );
};

export default KakaoLogin;
