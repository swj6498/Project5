import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logout from "../pages/Login/Logout";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import CustomSelect from "../common/CustomSelect";
import "./Header.css";

export default function Header() {
    const { isLoggedIn, user, logout } = useAuth();
    const { t } = useTranslation();

	const changeLang = (lang) => {
	    i18n.changeLanguage(lang);
	    localStorage.setItem("i18nextLng", lang);
	};

    return (
        <header className="stock-header">
            <div className="stock-header__inner">

                {/* 로고 */}
                <Link to="/" className="stock-header__logo">
                    <div className="stock-header__logo-icon">S</div>
                    <span className="stock-header__logo-text">StockNews</span>
                </Link>

                {/* 네비게이션 */}
                <nav className="stock-header__nav">
                    <Link to="/" className="stock-header__nav-item">{t("home")}</Link>
                    <Link to="/krx/list" className="stock-header__nav-item">{t("domesticStock")}</Link>
                    <div className="stock-header__dropdown">
                        <span className="stock-header__nav-item dropdown-trigger">
                            {t("news")} ▾
                        </span>

                        <div className="dropdown-menu">
						    <a href="/news?region=korea" className="dropdown-item">
						        {t("Domestic")}
						    </a>
						    <a href="/news?region=global" className="dropdown-item">
						        {t("International")}
						    </a>
						</div>
                    </div>
                    <Link to="/about" className="stock-header__nav-item">{t("about")}</Link>
                </nav>

                {/* 오른쪽 사용자 영역 */}
                <div className="stock-header__user">

                    {/* 언어 선택 */}
					<CustomSelect value={i18n.language} onChange={changeLang} />

                    {isLoggedIn && user ? (
                        <div className="stock-header__user-logged">
                            <span className="stock-header__user-name">
                                {t("helloUser", { name: user.nickname })}
                            </span>

                            <Link to="/mypage" className="stock-header__user-link">
                                {t("mypage")}
                            </Link>

                            <Logout onLogout={logout} />

                        </div>
                    ) : (
                        <Link to="/login" className="stock-header__login-btn">
                            {t("login")}
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
