import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logout from "../pages/Login/Logout";
import "./Header.css";

export default function Header() {
    const { isLoggedIn, userName, logout } = useAuth();

    return (
        <header className="stock-header">
            <div className="stock-header__inner">

                <Link to="/" className="stock-header__logo">
                    <div className="stock-header__logo-icon">S</div>
                    <span className="stock-header__logo-text">StockNews</span>
                </Link>

                <nav className="stock-header__nav">
                    <Link to="/" className="stock-header__nav-item">홈</Link>
                    <Link to="/krx/list" className="stock-header__nav-item">국내주식</Link>
                    <Link to="/news" className="stock-header__nav-item">뉴스</Link>
                    <Link to="#" className="stock-header__nav-item">About</Link>
                </nav>

                <div className="stock-header__user">
                    {isLoggedIn ? (
                        <div className="stock-header__user-logged">
                            <span className="stock-header__user-name">
                                {userName}님
                            </span>
                            <Link to="/mypage" className="stock-header__user-link">
                                마이페이지
                            </Link>

                            {/* AuthContext logout 전달 */}
                            <Logout onLogout={logout} />
                        </div>
                    ) : (
                        <Link to="/login" className="stock-header__login-btn">
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
	