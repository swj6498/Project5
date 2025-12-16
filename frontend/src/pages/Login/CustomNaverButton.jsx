import React from "react";
import "./CustomNaverButton.css";
import { useTranslation } from "react-i18next";

const CustomNaverButton = () => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (window.naverLogin) {
      window.naverLogin.getLoginStatus(() => {
        // 강제로 네이버 로그인 창 띄우는 핵심 코드
        window.document
          .querySelector("#naverIdLogin a")
          .click();
      });
    }
  };

  return (
    <button onClick={handleClick} className="custom-naver-btn">
      {t("loginNaver")}
    </button>
  );
};

export default CustomNaverButton;
