import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function Logout({ onLogout }) {
	const { t } = useTranslation();
    const navigate = useNavigate();

    const handleLogout = () => {
        axios.post("http://localhost:8585/api/auth/logout", {}, { withCredentials: true })
            .then(() => {
                alert("로그아웃 되었습니다.");

                // 부모에게 로그아웃 완료 알림 → Header 즉시 업데이트
                onLogout();

                // 페이지 이동만 하고 reload 제거
                navigate("/");
            })
            .catch(err => console.error("로그아웃 오류:", err));
    };

    return (
        <button className="stock-header__login-btn" onClick={handleLogout}>
            {t("logout")}
        </button>
    );
}

export default Logout;
