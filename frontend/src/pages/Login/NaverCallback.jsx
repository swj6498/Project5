import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const NaverCallback = () => {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  useEffect(() => {
    const fetchNaverLogin = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace("#", ""));
      const access_token = params.get("access_token");

      if (!access_token) {
        console.error("No access token from Naver");
        return;
      }

      try {
        const res = await axios.post(
          "http://localhost:8585/api/auth/naver/callback",
          { access_token }
        );

        const token = res.data.token?.trim();
        const nickname = res.data.user?.nickname; // ★ 여기!

        if (!token) {
          console.error("No JWT token returned");
          return;
        }

        if (!nickname) {
          console.error("No nickname found in backend response");
          return;
        }

        // AuthContext에 저장 → Header 즉시 반영됨
        loginSuccess(token);
		alert(`로그인 성공!`);
        navigate("/");
      } catch (err) {
        console.error("네이버 로그인 실패:", err);
      }
    };

    fetchNaverLogin();
  }, [navigate, loginSuccess]);

  return;
};

export default NaverCallback;
