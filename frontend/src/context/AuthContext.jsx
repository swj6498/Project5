import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // 새로고침 시 localStorage에서 JWT 복원 + DB 유저 정보 불러오기
  useEffect(() => {
    const token = localStorage.getItem("jwtToken");

    if (token && token !== "undefined") {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      loadUserInfo(token);
    }
  }, []);

  // 🔥 서버에서 진짜 유저 정보 가져오는 함수
  const loadUserInfo = async (token) => {
    try {
      const res = await axios.get("http://localhost:8585/api/info", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dbUser = res.data;

      setUser({
        ...dbUser,
        loginType: dbUser.social_type || dbUser.socialType || "LOCAL",
      });

      setIsLoggedIn(true);
    } catch (err) {
      console.error("사용자 정보 조회 실패:", err);
      logout();
    }
  };

  // 🔥 로그인 성공 → 토큰 저장 → 바로 DB 유저 정보 가져오기
  const loginSuccess = async (token) => {
    localStorage.setItem("jwtToken", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    await loadUserInfo(token); // ★ 여기! 즉시 DB 정보로 업데이트
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setUser(null);
    setIsLoggedIn(false);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loginSuccess, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
