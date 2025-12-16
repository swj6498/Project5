import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8585",
});

// 저장된 토큰 자동 포함
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
