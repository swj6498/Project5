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
import "./KrxDetail.css";
import { useTranslation } from "react-i18next";

function StockDetail() {
	
	// 변동 방향 키 추출 (판단 전용)
	const getChangeKey = (change) => {
	  if (!change) return "FLAT";

	  const value = String(change).trim();

	  if (value.includes("상한")) return "LIMIT_UP";
	  if (value.includes("하한")) return "LIMIT_DOWN";
	  if (value.includes("상승") || value.includes("▲") || value.includes("+")) return "UP";
	  if (value.includes("하락") || value.includes("▼") || value.includes("-")) return "DOWN";
	  if (value.includes("보합") || value === "0" || value === "0.00") return "FLAT";

	  return "FLAT";
	};

	// 숫자만 추출 ("하락3,800" → "3,800")
	const extractChangeNumber = (change) => {
	  if (!change) return "0";

	  const match = String(change).match(/([\d,]+)/);
	  return match ? match[1] : "0";
	};

	const CHANGE_CLASS_MAP = {
	  UP: "red",
	  LIMIT_UP: "red",
	  DOWN: "blue",
	  LIMIT_DOWN: "blue",
	  FLAT: "gray",
	};


	const { t } = useTranslation();
    const { code } = useParams();
    const navigate = useNavigate();
	
    const [stock, setStock] = useState(null);
    const [news, setNews] = useState([]);
    const [chartUrl, setChartUrl] = useState("");
    const [chartMode, setChartMode] = useState("area");
    const [chartPeriod, setChartPeriod] = useState("day");
    const [loading, setLoading] = useState(true);
    const [newsLoading, setNewsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [error, setError] = useState(null);
    const [priceInfo, setPriceInfo] = useState(null);
    const [priceLoading, setPriceLoading] = useState(true);
	
	const changeKey = getChangeKey(stock?.change);
  	const changeClass = CHANGE_CLASS_MAP[changeKey];
 	const changeNumber = extractChangeNumber(stock?.change);
  	const changeText = t(`stock.change.${changeKey}`);

	
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
                if (found) setStock(found);
                else setError("종목을 찾을 수 없습니다.");
            } catch (err) {
                console.error(err);
                setError(t("stockDetail.common.loadFail"));
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, [code]);


    useEffect(  () => {
        const fetchPriceInfo = async () => {
            try {
                setPriceLoading(true);
                const res = await axios.get(`/api/krx/price/${code}`);
                setPriceInfo(res.data);
            } catch (err) {
                console.error(err);
                setPriceInfo(null);
            } finally {
                setPriceLoading(false);
            }
        };
        if (code) fetchPriceInfo();
    }, [code]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setNewsLoading(true);
                const res = await axios.get(`/api/krx/news/${code}`);
                setNews(res.data || []);
            } catch (err) {
                console.error(err);
                setNews([]);
            } finally {
                setNewsLoading(false);
            }
        };
        if (code) fetchNews();
    }, [code]);

    useEffect(() => {
        const fetchChart = async () => {
            try {
                setChartLoading(true);
                const res = await axios.get(
                    `/api/krx/chart/${code}?type=${chartMode}&period=${chartPeriod}`
                );
                setChartUrl(res.data.imgUrl);
            } catch (err) {
                console.error(err);
                setChartUrl("");
            } finally {
                setChartLoading(false);
            }
        };
        if (code) fetchChart();
    }, [code, chartMode, chartPeriod]);

    if (loading) {
        return (
            <Box className="stock-detail__container">
                <LinearProgress />
                <Typography className="stock-detail__loading-text">
                    {t("stockDetail.common.loading")}
                </Typography>
            </Box>
        );
    }
    if (error)
        return <Alert severity="error" className="stock-detail__alert">{error}</Alert>;
    if (!stock)
        return <Alert severity="warning" className="stock-detail__alert">{t("stockDetail.common.notFound")}</Alert>;

    const linePeriods = [
        { label: t("stockDetail.chart.period.day"), value: "day" },
        { label: t("stockDetail.chart.period.week"), value: "week" },
        { label: t("stockDetail.chart.period.month3"), value: "month3" },
        { label: t("stockDetail.chart.period.year"), value: "year" },
        { label: t("stockDetail.chart.period.year3"), value: "year3" },
        { label: t("stockDetail.chart.period.year5"), value: "year5" },
        { label: t("stockDetail.chart.period.year10"), value: "year10" },
    ];
    const candlePeriods = [
        { label: t("stockDetail.chart.candlePeriod.day"), value: "day" },
        { label: t("stockDetail.chart.candlePeriod.week"), value: "week" },
        { label: t("stockDetail.chart.candlePeriod.month"), value: "month" },
    ];

    // 거래대금 억 단위 변환 헬퍼
    const formatTradeAmount = (amount) => {
        if (!amount || amount === 0) return "-";
        const billion = Math.round(amount / 100000000) / 10;
        return billion.toLocaleString() + "억 원";
    };

    return (
        <Box className="stock-detail__container">
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                className="stock-detail__back-btn"
            >
                {t("stockDetail.common.back")}
            </Button>

            {/* 종목 기본 정보 */}
            <Paper className="stock-detail__info">
                <Typography className="stock-detail__name">{stock.name}</Typography>
                <Typography className="stock-detail__code">{stock.code} • {stock.market || "KOSPI"}</Typography>

                <Box className="stock-detail__grid">
                    <Box>
                        <Typography className="stock-detail__label">{t("stockDetail.info.currentPrice")}</Typography>
                        <Typography className="stock-detail__value">{stock.current_price?.toLocaleString() || "-"}{t("won")}</Typography>
                    </Box>
					<Box>
					      <Typography className="stock-detail__label">
					        {t("stockDetail.info.change")}
					      </Typography>

					      <Typography className={`stock-detail__value ${changeClass}`}>
					        {changeKey === "FLAT"
					          ? `0 ${changeText}`
					          : `${changeNumber} ${changeText}`}
					      </Typography>
					    </Box>
                    <Box>
                        <Typography className="stock-detail__label">{t("stockDetail.info.changeRate")}</Typography>
                        <Typography className={`stock-detail__value ${stock.change_rate?.includes("+") ? "red" : "blue"}`}>{stock.change_rate || "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">{t("stockDetail.info.volume")}</Typography>
                        <Typography className="stock-detail__value">{stock.volume?.toLocaleString() || "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">{t("stockDetail.info.marketCap")}</Typography>
                        <Typography className="stock-detail__value">{stock.market_cap ? stock.market_cap.toLocaleString() + t("hundredMillion") : "-"}</Typography>
                    </Box>
                    <Box>
                        <Typography className="stock-detail__label">{t("stockDetail.info.foreignRatio")}</Typography>
                        <Typography className="stock-detail__value">{stock.foreign_ratio?.toFixed(1)}%</Typography>
                    </Box>
                </Box>
            </Paper>

            {/* 주요 시세 섹션 - 실시간 데이터 */}
            <Paper className="stock-detail__info" style={{ marginTop: "30px" }}>
                <Typography className="stock-detail__chart-title">{t("stockDetail.price.title")}</Typography>
                {priceLoading ? (
                    <LinearProgress style={{ margin: "20px" }} />
                ) : (
                    <Box className="stock-detail__grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "16px", padding: "0 20px" }}>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.prevClose")}</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.prevClose ? priceInfo.prevClose.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.open")}</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.openPrice ? priceInfo.openPrice.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.high")}</Typography>
                            <Typography className="stock-detail__value" style={{ color: "#d32f2f" }}>
                                {priceInfo?.highPrice ? priceInfo.highPrice.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.low")}</Typography>
                            <Typography className="stock-detail__value" style={{ color: "#1976d2" }}>
                                {priceInfo?.lowPrice ? priceInfo.lowPrice.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.upperLimit")}</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.upperLimit ? priceInfo.upperLimit.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography className="stock-detail__label">{t("stockDetail.price.lowerLimit")}</Typography>
                            <Typography className="stock-detail__value">
                                {priceInfo?.lowerLimit ? priceInfo.lowerLimit.toLocaleString() : "-"}{t("won")}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            {/* 차트 모드 선택 */}
            <Box className="stock-detail__chart-mode">
                <Button
                    className={chartMode === "area" ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                    onClick={() => { setChartMode("area"); setChartPeriod("day"); }}
                >
                   {t("stockDetail.chart.area")}
                </Button>
                <Button
                    className={chartMode === "candle" ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                    onClick={() => { setChartMode("candle"); setChartPeriod("day"); }}
                >
                    {t("stockDetail.chart.candle")}
                </Button>
            </Box>

            {/* 차트 기간 선택 */}
            <Box className="stock-detail__chart-period">
                {(chartMode === "area" ? linePeriods : candlePeriods).map((p) => (
                    <Button
                        key={p.value}
                        className={chartPeriod === p.value ? "stock-detail__btn-contained" : "stock-detail__btn-outlined"}
                        onClick={() => setChartPeriod(p.value)}
                    >
                        {p.label}
                    </Button>
                ))}
            </Box>

            {/* 차트 이미지 */}
            <Paper className="stock-detail__chart-card">
                <Typography className="stock-detail__chart-title">{t("stockDetail.chart.title")}</Typography>
                {chartLoading ? (
                    <Box className="stock-detail__chart-loading">
                        <LinearProgress />
                        <Typography>{t("stockDetail.chart.loading")}</Typography>
                    </Box>
                ) : chartUrl ? (
                    <img src={chartUrl} alt="주가 차트" className="stock-detail__chart-image"/>
                ) : (
                    <Typography>{t("stockDetail.chart.unavailable")}</Typography>
                )}
            </Paper>

            {/* 뉴스 */}
            <Paper className="stock-detail__news-card">
                <Typography className="stock-detail__news-title">{t("stockDetail.news.title")}</Typography>
                <Divider className="stock-detail__divider"/>
                {newsLoading ? (
                    <Box className="stock-detail__chart-loading">
                        <LinearProgress />
                        <Typography>{t("stockDetail.news.loading")}</Typography>
                    </Box>
                ) : news.length === 0 ? (
                    <Typography>{t("stockDetail.news.empty")}</Typography>
                ) : (
                    news.map((item, i) => (
                        <Box key={i} className="stock-detail__news-item">
                            <Typography component="div" className="stock-detail__news-link">
                                <a href={item.link} target="_blank" rel="noopener noreferrer">
                                    {item.title}
                                </a>
                                {item.related && <Chip label={item.related} size="small" style={{ marginLeft: "8px" }} />}
                            </Typography>
                            <Typography className="stock-detail__news-date">{item.date}</Typography>
                        </Box>
                    ))
                )}
                <Box className="stock-detail__news-more">
                    <Button variant="outlined" href={`https://finance.naver.com/item/news.naver?code=${code}`} target="_blank">
                        {t("stockDetail.news.more")}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}

export default StockDetail;