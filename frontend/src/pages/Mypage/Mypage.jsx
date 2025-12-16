import React from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";
import { useTranslation } from "react-i18next";

const Mypage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <p>{t("needLogin")}</p>;

  const handleDeleteAccount = async () => {
    if (!window.confirm(t("confirmDelete"))) return;

    try {
      const res = await axios.post(
        "http://localhost:8585/api/deleteUser",
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("jwtToken")}` } }
      );
	  console.log("백엔드 응답:", res.data);
      if (res.data === 1) {
        alert(t("deleteSuccess"));
        logout();
        navigate("/");
      } else {
        alert(t("deleteFail"));
      }
    } catch (err) {
      console.error(err);
      alert(t("serverError"));
    }
  };

  return (
    <div className="mypage-wrap">
      <div className="mypage-container">
        <h2 className="mypage-title">{t("mypage")}</h2>
        <img
          src={
            user.profileImage
              ? user.profileImage.startsWith("http")
                ? user.profileImage
                : `http://localhost:8585/uploads/${encodeURIComponent(user.profileImage)}`
              : "/Default-Profile.png"
          }
          alt="프로필"
          className="user-profileImage"
        />
        <div className="user-info-box">
          {user.loginType === "LOCAL" && <p><strong>{t("id")}:</strong> {user.user_id}</p>}
          <p><strong>{t("nickname")}:</strong> {user.nickname}</p>
          <p><strong>{t("email")}:</strong> {user.email}</p>
          <p><strong>{t("createdAt")}:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p>
            <strong>{t("loginType")}:</strong>{" "}
            {user.loginType === "KAKAO"
              ? t("loginKakao")
              : user.loginType === "NAVER"
              ? t("loginNaver")
			  : user.loginType === "GOOGLE"
			  ? t("loginGoogle")
              : t("loginLocal")}
          </p>
        </div>

        {user.loginType === "LOCAL" && (
          <button className="modify_link" onClick={() => navigate("/updateMypage")}>
            {t("editUserInfo")}
          </button>
        )}
        <button className="delete-btn" onClick={handleDeleteAccount}>
          {t("deleteAccount")}
        </button>
      </div>
    </div>
  );
};

export default Mypage;
