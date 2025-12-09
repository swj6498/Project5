// src/pages/Stock/KrxList.jsx - 진짜 완전 끝판왕 + 전일비/등락률 색상 완벽 분리
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    LinearProgress,
    Alert,
    Tabs,
    Tab,
    TextField,
    InputAdornment,
    Pagination,
    Skeleton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "./KrxList.css";

function KrxList() {
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [kospi, setKospi] = useState([]);
    const [kosdaq, setKosdaq] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [recentStocks, setRecentStocks] = useState([]);
    const [tradeRanking, setTradeRanking] = useState([]);
    const [recentLoading, setRecentLoading] = useState(true);
    const [rankingLoading, setRankingLoading] = useState(true);
    const ITEMS_PER_PAGE = 50;
    const currentTabData = tab === 0 ? kospi : kosdaq;

    const formatKoreanTime = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);

            // 날짜 유효성 체크
            if (isNaN(date.getTime())) return dateStr;

            // 한국 시간(-9)
            const koreaTime = new Date(date.getTime() - 9 * 60 * 60 * 1000);

            const yyyy = koreaTime.getFullYear();
            const mm = String(koreaTime.getMonth() + 1).padStart(2, "0");
            const dd = String(koreaTime.getDate()).padStart(2, "0");
            const hh = String(koreaTime.getHours()).padStart(2, "0");
            const min = String(koreaTime.getMinutes()).padStart(2, "0");
            const ss = String(koreaTime.getSeconds()).padStart(2, "0");

            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        } catch {
            return dateStr;
        }
    };

    // 데이터 로드 (생략 - 그대로)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [kospiRes, kosdaqRes] = await Promise.all([
                    axios.get("/api/krx/kospi/list"),
                    axios.get("/api/krx/kosdaq/list"),
                ]);
                setKospi(kospiRes.data || []);
                setKosdaq(kosdaqRes.data || []);
            } catch (err) {
                setError("데이터 로드 실패");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const loadRecent = async () => {
            try {
                setRecentLoading(true);
                const res = await axios.get("/api/krx/recent");
                const data = res.data || [];
                const uniqueMap = new Map();
                data.forEach(item => uniqueMap.has(item.code) || uniqueMap.set(item.code, item));
                setRecentStocks(Array.from(uniqueMap.values()).slice(0, 5));
            } finally {
                setRecentLoading(false);
            }
        };
        loadRecent();
    }, []);

    useEffect(() => {
        const loadRanking = async () => {
            try {
                setRankingLoading(true);
                const res = await axios.get("/api/krx/ranking/trade");
                setTradeRanking(res.data || []);
            } finally {
                setRankingLoading(false);
            }
        };
        loadRanking();
        const interval = setInterval(loadRanking, 30000);
        return () => clearInterval(interval);
    }, []);

    const goToDetail = async (stock) => {
        try {
            await axios.post("/api/krx/recent/add", { code: stock.code, name: stock.name });
            setRecentStocks(prev => {
                const filtered = prev.filter(s => s.code !== stock.code);
                return [{ code: stock.code, name: stock.name }, ...filtered].slice(0, 5);
            });
        } catch (err) {
            console.error(err);
        }
        navigate(`/krx/${stock.code}`);
    };

    const filteredData = React.useMemo(() => {
        const data = tab === 0 ? kospi : kosdaq;
        if (!searchTerm.trim()) return data;
        const term = searchTerm.trim().toLowerCase();
        return data.filter(stock =>
            stock.name?.toLowerCase().includes(term) ||
            stock.code?.includes(term)
        );
    }, [kospi, kosdaq, tab, searchTerm]);

    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const displayData = filteredData.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const formatNumber = (num) => (num != null ? num.toLocaleString() : "-");
    const formatPrice = (price) => (price != null ? price.toLocaleString() + "원" : "-");

    const calculateTradeAmount = (stock) => {
        const price = stock.current_price || 0;
        const volume = stock.volume || 0;
        return Math.round((price * volume) / 100000000);
    };

    // 테이블 렌더링 - 전일비/등락률 색상 완벽 분리!
    const renderTable = (data) => (
        <TableContainer component={Paper} className="krx-table-container">
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow className="krx-table-head">
                        {["순위", "종목명", "현재가", "전일비", "등락률", "거래량", "거래대금(억)", "시총(억)", "외인", "PER", "ROE"].map(h => (
                            <TableCell key={h} align="center" className="krx-head-cell">
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((stock, idx) => {
                        const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx + 1;

                        // 전일비 색상 (독립 계산)
                        const changeUp = stock.change?.includes("+");
                        const changeDown = stock.change?.includes("-");
                        const changeColor = changeUp ? "#dc2626" : changeDown ? "#2563eb" : "#64748b";

                        // 등락률 색상 (독립 계산)
                        const rateUp = stock.change_rate?.includes("+");
                        const rateDown = stock.change_rate?.includes("-");
                        const rateColor = rateUp ? "#dc2626" : rateDown ? "#2563eb" : "#64748b";

                        return (
                            <TableRow key={stock.code} className="krx-table-row" hover>
                                <TableCell align="center">
                                    <Chip
                                        label={globalIdx}
                                        size="small"
                                        className={globalIdx <= 3 ? "krx-rank-top" : "krx-rank-normal"}
                                    />
                                </TableCell>
                                <TableCell onClick={() => goToDetail(stock)} className="krx-name-cell">
                                    <div className="krx-stock-name">{stock.name}</div>
                                    <div className="krx-stock-code">{stock.code}</div>
                                </TableCell>
                                <TableCell align="center" className="krx-price-cell">
                                    {formatPrice(stock.current_price)}
                                </TableCell>

                                {/* 전일비 */}
                                <TableCell align="center" className={`krx-change-cell ${stock.change?.includes("상승") ? "krx-up" : stock.change?.includes("하락") ? "krx-down" : ""}`}>
                                    {stock.change || "-"}
                                </TableCell>

                                {/* 등락률 */}
                                <TableCell align="center" className={`krx-change-cell ${stock.change_rate?.includes("+") ? "krx-up" : stock.change_rate?.includes("-") ? "krx-down" : ""}`}>
                                    {stock.change_rate || "-"}
                                </TableCell>

                                <TableCell align="center" className="krx-number-cell">{formatNumber(stock.volume)}</TableCell>
                                <TableCell align="center" className="krx-number-cell">{formatNumber(calculateTradeAmount(stock))}</TableCell>
                                <TableCell align="center" className="krx-number-cell">{formatNumber(stock.market_cap)}</TableCell>
                                <TableCell align="center" className="krx-number-cell">
                                    {stock.foreign_ratio ? `${stock.foreign_ratio.toFixed(1)}%` : "-"}
                                </TableCell>
                                <TableCell align="center" className="krx-number-cell">{stock.per?.toFixed(2) || "-"}</TableCell>
                                <TableCell align="center" className="krx-number-cell">{stock.roe ? `${stock.roe.toFixed(2)}%` : "-"}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );

    if (loading) return (
        <Box className="krx-loading-wrapper">
            <LinearProgress className="krx-loading-bar" />
            <Typography className="krx-loading-text">실시간 시세 로딩 중...</Typography>
        </Box>
    );

    if (error) return <Alert severity="error" className="krx-error-alert">{error}</Alert>;

    return (
        <Box className="krx-page-wrapper">
            <Box className="krx-main-content">
                <Typography className="krx-page-title">KRX 실시간 시세표 (시가총액)</Typography>
                {currentTabData.length > 0 && (
                    <Typography className="krx-crawled-time">
                        기준 시간: {formatKoreanTime(currentTabData[0].crawled_at)}
                    </Typography>
                )}
                {/* 최근 본 종목 */}
                {recentLoading ? (
                    <Skeleton className="krx-recent-skeleton" />
                ) : recentStocks.length > 0 && (
                    <Paper className="krx-recent-container">
                        <Typography className="krx-recent-title">최근 본 종목</Typography>
                        <Box className="krx-recent-chips">
                            {recentStocks.map(stock => (
                                <Chip
                                    key={stock.code}
                                    label={`${stock.name} (${stock.code})`}
                                    onClick={() => navigate(`/krx/${stock.code}`)}
                                    className="krx-recent-chip"
                                />
                            ))}
                        </Box>
                    </Paper>
                )}

                {/* 검색창 */}
                <Box className="krx-search-wrapper">
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="종목명 또는 코드 검색"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        className="krx-search-input"
                    />
                    {searchTerm && (
                        <Typography className="krx-search-result">
                            검색 결과: <strong>{totalItems}</strong>개
                        </Typography>
                    )}
                </Box>

                {/* 탭 */}
                <Tabs value={tab} onChange={(_, v) => { setTab(v); setPage(1); setSearchTerm(""); }} centered className="krx-tabs">
                    <Tab label={`KOSPI (${kospi.length}종목)`} />
                    <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
                </Tabs>

                <Typography className="krx-page-info">
                    페이지 {page} / {totalPages} • 총 {totalItems}종목
                </Typography>

                {renderTable(displayData)}

                {totalPages > 1 && (
                    <Box className="krx-pagination-wrapper">
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                            color="primary"
                            size="large"
                        />
                    </Box>
                )}
            </Box>

            {/* 오른쪽 랭킹 사이드바 */}
            <Paper className="krx-ranking-sidebar">
                <Typography className="krx-ranking-title">거래대금 Top5</Typography>
                {rankingLoading ? (
                    [...Array(5)].map((_, i) => <Skeleton key={i} className="krx-ranking-skeleton" />)
                ) : tradeRanking.length > 0 ? (
                    tradeRanking.map((item, i) => (
                        <Box key={item.code} onClick={() => goToDetail({ code: item.code, name: item.name })} className="krx-ranking-item">
                            <Box className="krx-ranking-item-inner">
                                <Box>
                                    <Typography className="krx-ranking-rank">{item.rank}위</Typography>
                                    <Typography className="krx-ranking-name">{item.name}</Typography>
                                </Box>
                                <Typography className="krx-ranking-amount">{item.score?.toLocaleString()}억</Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    <Typography className="krx-ranking-empty">데이터 없음</Typography>
                )}
            </Paper>
        </Box>
    );
}

export default KrxList;