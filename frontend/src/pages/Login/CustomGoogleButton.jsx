import React from "react";
import "./CustomGoogleButton.css";
import { useTranslation } from "react-i18next";

const CustomGoogleButton = () => {
  const { t } = useTranslation();
  const handleGoogleLogin = () => {
    const googleBtn = document.querySelector("#googleLoginButton div[role='button']");
    if (googleBtn) {
      googleBtn.click();
    } else {
      console.error("Google login button not found.");
    }
  };

  return (
    <button className="custom-google-btn" onClick={handleGoogleLogin}>
	{t("loginGoogle")}
    </button>
  );
};

export default CustomGoogleButton;
