// GoogleLogin.jsx
import React, { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const GoogleLogin = () => {
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  
  const handleGoogleCallback = async (response) => {
    try {
      const idToken = response.credential;

      const res = await axios.post("http://localhost:8585/api/auth/google", {
        idToken: idToken,
      });

      loginSuccess(res.data.token);
      alert("구글 로그인 성공!");
	  navigate("/");
    } catch (e) {
      console.error(e);
      alert("구글 로그인 실패!");
    }
  };

  useEffect(() => {
    const waitForGoogleSDK = setInterval(() => {
      if (window.google && window.google.accounts) {
        clearInterval(waitForGoogleSDK);

        window.google.accounts.id.initialize({
          client_id:
            "925554401773-fojodmg8ktecqu8g8usn87ifkh78fafc.apps.googleusercontent.com",
          callback: handleGoogleCallback,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleLoginButton"),
          { theme: "outline", size: "large" }
        );
      }
    }, 200);

    return () => clearInterval(waitForGoogleSDK);
  }, []);

  return (
    <div
      id="googleLoginButton"
      style={{ display: "none" }} // 숨겨진 실제 구글 로그인 버튼
    ></div>
  );
};

export default GoogleLogin;
