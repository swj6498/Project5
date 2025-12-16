import React, { useEffect } from "react";
import "./NaverLogin.css";

const NaverLogin = () => {
  useEffect(() => {
    if (!window.naver) return;

    const naverLogin = new window.naver.LoginWithNaverId({
      clientId: "WZGOnTNYthFm9SuYQzfY",
      callbackUrl: "http://localhost:5173/login/naver/callback",
      isPopup: false,
      loginButton: { color: "green", type: 3, height: 48 },
    });

    naverLogin.init();

    // 로그인 객체를 전역에 저장해서 커스텀 버튼에서 사용할 수 있게 함
    window.naverLogin = naverLogin;
  }, []);

  return (
    <div style={{ display: "none" }}>
      <div id="naverIdLogin"></div>
    </div>
  );
};

export default NaverLogin;
