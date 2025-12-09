// src/pages/StockDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Button,
    LinearProgress,
    Alert,
    Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function StockDetail() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [stock, setStock] = useState(null);
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. 종목 기본 정보 로드
    useEffect(() => {
        const fetchStock = async () => {
            try {
                setLoading(true);
                const [kospiRes, kosdaqRes] = await Promise.all([
                    axios.get("/api/krx/kospi/list"),
                    axios.get("/api/krx/kosdaq/list"),
                ]);

                const all = [...(kospiRes.data || []), ...(kosdaqRes.data || [])];
                const found = all.find((s) => s.code === code);

                if (found) {
                    setStock(found);
                } else {
                    setError("종목을 찾을 수 없습니다.");
                }
            } catch (err) {
                console.error("종목 로드 실패:", err);
                setError("데이터 로드 실패");
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, [code]);

    // 2. 뉴스 로드 (백엔드 API 사용)
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setNewsLoading(true);
                const res = await axios.get(`/api/krx/news/${code}`);
                setNews(res.data || []);
            } catch (err) {
                console.error("뉴스 로드 실패:", err);
                setNews([]);
            } finally {
                setNewsLoading(false);
            }
        };

        if (code) fetchNews();
    }, [code]);

    if (loading) {
        return (
            <Box sx={{ p: 4 }}>
                <LinearProgress />
                <Typography textAlign="center" mt={2}>종목 정보 로딩 중...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
    }

    if (!stock) {
        return <Alert severity="warning" sx={{ m: 4 }}>종목을 찾을 수 없습니다.</Alert>;
    }

    return (
        <Box sx={{ p: { xs: 2, sm: 4 }, maxWidth: 900, mx: "auto" }}>
            {/* 뒤로가기 */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ mb: 3 }}
            >
                뒤로가기
            </Button>

            {/* 종목 정보 */}
            <Paper sx={{ p: 4, borderRadius: 3, bgcolor: "#f8fbff" }}>
                <Typography variant="h3" fontWeight="bold" color="#0d47a1" gutterBottom>
                    {stock.name}
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    {stock.code} • {stock.market || "KOSPI"}
                </Typography>

                <Box
                    sx={{
                        mt: 4,
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                        gap: 3,
                    }}
                >
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            현재가
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="#0d47a1">
                            {stock.current_price?.toLocaleString() || "-"}원
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            전일비
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                color: stock.change?.includes("+") ? "red" : "blue",
                                fontWeight: "bold",
                            }}
                        >
                            {stock.change || "-"}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            등락률
                        </Typography>
                        <Typography
                            variant="h5"
                            sx={{
                                color: stock.change_rate?.includes("+") ? "red" : "blue",
                                fontWeight: "bold",
                            }}
                        >
                            {stock.change_rate || "-"}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            거래량
                        </Typography>
                        <Typography variant="h5">
                            {stock.volume?.toLocaleString() || "-"}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            시가총액
                        </Typography>
                        <Typography variant="h5">
                            {stock.market_cap
                                ? stock.market_cap.toLocaleString() + "억" // 👈 나눗셈 제거, 포맷팅만 적용
                                : "-"}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            외국인 비율
                        </Typography>
                        <Typography variant="h5">
                            {stock.foreign_ratio?.toFixed(1)}% {stock.foreign_ratio ? "" : "-"}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            {/* 뉴스 섹션 */}
            <Paper sx={{ p: 4, mt: 4, borderRadius: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    실시간 뉴스공시
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {newsLoading ? (
                    <Box sx={{ py: 4, textAlign: "center" }}>
                        <LinearProgress />
                        <Typography mt={2} color="text.secondary">
                            뉴스 로딩 중...
                        </Typography>
                    </Box>
                ) : news.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" py={4}>
                        뉴스가 없습니다.
                    </Typography>
                ) : (
                    <Box>
                        {news.map((item, i) => (
                            <Box
                                key={i}
                                sx={{
                                    py: 2,
                                    borderBottom: i < news.length - 1 ? "1px solid #eee" : "none",
                                }}
                            >
                                <Typography variant="body1" fontWeight="medium">
                                    <a
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: "#0d47a1",
                                            textDecoration: "none",
                                        }}
                                        onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
                                        onMouseOut={(e) => (e.target.style.textDecoration = "none")}
                                    >
                                        {item.title}
                                    </a>
                                    {item.related && (
                                        <Chip
                                            label={item.related}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            sx={{ ml: 1, height: 22, fontSize: "0.7rem" }}
                                        />
                                    )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {item.date}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}

                <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Button
                        variant="outlined"
                        href={`https://finance.naver.com/item/news.naver?code=${code}`}
                        target="_blank"
                    >
                        네이버 증권 뉴스 전체보기
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default StockDetail;