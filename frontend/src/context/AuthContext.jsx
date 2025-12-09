import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState("");

    // 🔥 앱 시작 시 서버 세션 자동 확인 (새로고침해도 로그인 유지 핵심)
    useEffect(() => {
        axios
            .get("http://localhost:8585/api/auth/session/user", {
                withCredentials: true,
            })
            .then((res) => {
                if (res.data.loggedIn) {
                    setIsLoggedIn(true);
                    setUserName(res.data.nickname);
                }
            })
            .catch((err) => console.log("세션 체크 실패:", err));
    }, []);

    const loginSuccess = (nickname) => {
        setIsLoggedIn(true);
        setUserName(nickname);
    };

    const logout = () => {
        setIsLoggedIn(false);
        setUserName("");
    };

    return (
        <AuthContext.Provider
            value={{ isLoggedIn, userName, loginSuccess, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
