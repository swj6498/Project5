// src/pages/Stock/KrxList.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, Tabs, Tab,
  TextField, InputAdornment, Pagination, CircularProgress,
  IconButton, Tooltip, Checkbox, FormControlLabel
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "./KrxList.css";

const ITEMS_PER_PAGE = 50;

function KrxList() {
  const FASTAPI_BASE = "http://localhost:8000";

  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // URL 쿼리에서 초기 검색어 읽기
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get("q") || "";

  const [tab, setTab] = useState(0);
  const [kospi, setKospi] = useState([]);
  const [kosdaq, setKosdaq] = useState([]);
  const [loading, setLoading] = useState(true);

  // 검색 & 오타수정 상태
  const [searchTerm, setSearchTerm] = useState(initialQuery);       // 인풋에 보이는 값
  const [effectiveTerm, setEffectiveTerm] = useState(initialQuery); // 실제 필터링에 사용하는 값
  const [correctionSuggestion, setCorrectionSuggestion] = useState(null);

  const [page, setPage] = useState(1);
  const [recentStocks, setRecentStocks] = useState([]);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [favoriteSet, setFavoriteSet] = useState(new Set());

  const [rankingData, setRankingData] = useState([]);
  const [rankingTypeIndex, setRankingTypeIndex] = useState(0);

  // ---------------- 필터 & 정렬 상태 ----------------
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState({
    volumeMin: null,
    marketCapMin: null,
  });

  const rankingTypes = [
    { label: "거래대금", api: "/api/krx/ranking/trade", field: "score" },
    { label: "거래량", api: "/api/krx/ranking/volume", field: "volume" },
    { label: "등락률", api: "/api/krx/ranking/change", field: "changeRate" },
    { label: "시가총액", api: "/api/krx/ranking/market", field: "marketCap" },
    { label: "혼합점수", api: "/api/krx/ranking/mixed", field: "mixedScore" },
  ];

  const formatKoreanTime = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    const adjustedTime = new Date(date.getTime() - 9 * 60 * 60 * 1000);
    return adjustedTime
      .toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })
      .slice(0, -3);
  };

  const formatNumber = (n) => (n != null ? n.toLocaleString() : "-");
  const formatPrice = (p) => (p != null ? p.toLocaleString() + "원" : "-");
  const calculateTradeAmount = (s) =>
    Math.round(((s.current_price || 0) * (s.volume || 0)) / 1e8);

  // ---------------- 오타 수정 기능 ----------------
  const fetchCorrection = useCallback(async (query) => {
    const q = (query || "").trim();
    if (q.length < 2) {
      setCorrectionSuggestion(null);
      return;
    }

    try {
      const res = await axios.get(`${FASTAPI_BASE}/search-correction-smart`, {
        params: { q },
      });
      const result = res.data; // { original, ime_converted, atlas }

      const atlas = result.atlas; // { original, corrected, score, code, market } [file:1]

      if (atlas && atlas.corrected && atlas.corrected !== q) {
        setCorrectionSuggestion({
          original: result.original,          // 사용자가 친 원래 문자열 (예: tkatjd)
          imeConverted: result.ime_converted, // IME 결과 (예: 삼성)
          corrected: atlas.corrected,         // Atlas 최종 교정 (예: 삼성전자)
          score: atlas.score,
          code: atlas.code,
          market: atlas.market,
        });
      } else {
        setCorrectionSuggestion(null);
      }
    } catch (e) {
      console.error("오타 수정 호출 실패:", e);
      setCorrectionSuggestion(null);
    }
  }, []);

  
  // URL에서 넘어온 초기 q에 대해 한 번 자동 오타 교정 실행
  useEffect(() => {
    const q = (initialQuery || "").trim();
    if (!q) return;

    setEffectiveTerm(q);   // 일단 원본으로 필터링
    fetchCorrection(q);    // IME + Atlas 교정 제안 띄우기
  }, [initialQuery, fetchCorrection]);


  // ---------------- KRX 리스트 조회 ----------------
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
      console.error("KRX 리스트 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- 최근/즐겨찾기 ----------------
  const loadRecentStocks = () => {
    axios
      .get("/api/krx/recent")
      .then((res) => {
        const unique = Array.from(
          new Map((res.data || []).map((s) => [s.code, s])).values()
        ).slice(0, 5);
        setRecentStocks(unique);
      })
      .catch(() => {});
  };

  const loadFavorites = async () => {
    if (!isLoggedIn) {
      setFavoriteStocks([]);
      setFavoriteSet(new Set());
      return;
    }
    try {
      const res = await axios.get("/api/krx/favorites");
      setFavoriteStocks(res.data);
      setFavoriteSet(new Set(res.data.map((s) => s.code)));
    } catch (err) {
      console.error("즐겨찾기 로드 실패:", err);
    }
  };

  const toggleFavorite = async (stock) => {
    if (!isLoggedIn) return alert("로그인 후 이용 가능합니다!");
    const isFav = favoriteSet.has(stock.code);
    try {
      if (isFav)
        await axios.delete("/api/krx/favorites/remove", {
          data: { code: stock.code },
        });
      else
        await axios.post("/api/krx/favorites/add", {
          code: stock.code,
          name: stock.name,
        });
      loadFavorites();
    } catch {
      alert(isFav ? "삭제 실패" : "추가 실패");
    }
  };

  const goToDetail = async (stock) => {
    try {
      await axios.post("/api/krx/recent/add", {
        code: stock.code,
        name: stock.name,
      });
      setRecentStocks((prev) => {
        const filtered = prev.filter((s) => s.code !== stock.code);
        return [{ code: stock.code, name: stock.name }, ...filtered].slice(
          0,
          5
        );
      });
    } catch (e) {
      console.error("최근 본 종목 저장 실패:", e);
    }
    navigate(`/krx/${stock.code}`);
  };

  // ---------------- 랭킹 ----------------
  const loadRankingData = useCallback(async () => {
    const type = rankingTypes[rankingTypeIndex];
    try {
      const res = await axios.get(type.api);
      setRankingData(res.data || []);
    } catch (err) {
      console.error(`${type.label} 랭킹 로드 실패`, err);
      setRankingData([]);
    }
  }, [rankingTypeIndex]);

  // ---------------- 초기 로드 ----------------
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    loadRecentStocks();
    loadFavorites();
    loadRankingData();
    const rankingInterval = setInterval(
      () =>
        setRankingTypeIndex((prev) => (prev + 1) % rankingTypes.length),
      10000
    );
    return () => clearInterval(rankingInterval);
  }, [loadRankingData, isLoggedIn]);

  useEffect(() => {
    loadRankingData();
  }, [rankingTypeIndex, loadRankingData]);

  const currentData = tab === 0 ? kospi : kosdaq;

  // ---------------- 검색 & 탭 핸들러 ----------------
  const handleTabChange = (_, v) => {
    setTab(v);
    setPage(1);
    setSearchTerm("");
    setEffectiveTerm("");
    setCorrectionSuggestion(null);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);     // 인풋 표시용
    setEffectiveTerm(value);  // 실시간 필터링용
    setPage(1);
  };

  // 엔터/검색 아이콘 클릭 시 검색 + 오타 교정 실행
  const runSearch = () => {
    const value = (searchTerm || "").trim();
    if (!value) return;

    // 여기서는 effectiveTerm을 다시 한 번 확정해 주는 정도
    setEffectiveTerm(value);
    setPage(1);

    // ✅ 오타 교정은 이 시점에만
    fetchCorrection(value);
  };


  const handlePageChange = (_, v) => {
    setPage(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------------- tradeAmount 추가 ----------------
  const processedData = useMemo(
    () =>
      currentData.map((stock) => ({
        ...stock,
        tradeAmount: calculateTradeAmount(stock),
      })),
    [currentData]
  );

  // ---------------- 검색 필터링 ----------------
  const filteredData = useMemo(() => {
    let data = processedData;
    const term = (effectiveTerm || "").trim().toLowerCase();
    if (term) {
      data = data.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.code?.includes(term)
      );
    }
    return data;
  }, [processedData, effectiveTerm]);


  // ---------------- 정렬 & 필터 적용 ----------------
  const sortedData = useMemo(() => {
    let data = [...filteredData];

    if (showFavoritesOnly) data = data.filter((s) => favoriteSet.has(s.code));
    if (filters.volumeMin)
      data = data.filter((s) => (s.volume || 0) >= filters.volumeMin);
    if (filters.marketCapMin)
      data = data.filter(
        (s) => (s.market_cap || 0) >= filters.marketCapMin
      );

    if (sortField) {
      data = data.map((item, index) => ({ item, index }));
      data.sort((a, b) => {
        let aVal = a.item[sortField] ?? 0;
        let bVal = b.item[sortField] ?? 0;

        // 등락률 숫자로 변환
        if (sortField === "change_rate") {
          aVal = parseFloat(aVal?.replace("%", "")) || 0;
          bVal = parseFloat(bVal?.replace("%", "")) || 0;
        }

        // 종목명 가나다순
        if (sortField === "name") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (aVal === bVal) return a.index - b.index;
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
      data = data.map((d) => d.item);
    }

    return data;
  }, [filteredData, sortField, sortOrder, filters, showFavoritesOnly]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const displayData = sortedData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleSort = (field) => {
    if (sortField === field)
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const formatRankingValue = (item, field) => {
    const value = item[field];
    if (value == null) return "-";
    if (["score", "mixedScore"].includes(field))
      return (Math.floor(Number(value) / 1e8)).toLocaleString() + "억";
    if (["marketCap"].includes(field))
      return Math.floor(Number(value)).toLocaleString() + "억";
    if (field === "volume" || field === "tradeAmount")
      return Number(value).toLocaleString();
    if (field === "changeRate") return value.toString();
    return Number(value).toLocaleString();
  };

  if (loading)
    return (
      <Box className="krx-loading-wrapper">
        <CircularProgress size={60} thickness={4} />
        <Typography className="krx-loading-text">
          실시간 시세 로딩 중...
        </Typography>
      </Box>
    );

  return (
    <Box className="krx-page-wrapper">
      <Box className="krx-main-content">
        <Typography className="krx-page-title">
          KRX 실시간 시세표
        </Typography>
        {currentData.length > 0 && (
          <Typography className="krx-crawled-time">
            기준 시간: {formatKoreanTime(currentData[0].crawled_at)}
          </Typography>
        )}

        {/* 즐겨찾기/최근 */}
        {favoriteStocks.length > 0 && (
          <Box className="krx-favorite-section">
            <Typography className="krx-section-title">
              나의 즐겨찾기 ({favoriteStocks.length})
            </Typography>
            <Box className="krx-chips-wrapper">
              {favoriteStocks.map((stock) => (
                <Chip
                  key={stock.code}
                  label={`${stock.name} (${stock.code})`}
                  onClick={() => goToDetail(stock)}
                  onDelete={() => toggleFavorite(stock)}
                  deleteIcon={<StarIcon className="krx-star-icon" />}
                  className="krx-favorite-chip"
                />
              ))}
            </Box>
          </Box>
        )}
        {recentStocks.length > 0 && (
          <Box className="krx-recent-section">
            <Typography className="krx-section-title">
              최근 본 종목
            </Typography>
            <Box className="krx-chips-wrapper">
              {recentStocks.map((s) => (
                <Chip
                  key={s.code}
                  label={`${s.name} (${s.code})`}
                  onClick={() => goToDetail(s)}
                  className="krx-recent-chip"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 검색 + 오타 수정 제안 */}
        <Box className="krx-search-wrapper">
          <TextField
            fullWidth
            placeholder="종목명 또는 코드 검색"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                runSearch();
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon
                    sx={{ cursor: "pointer" }}
                    onClick={runSearch}
                  />
                </InputAdornment>
              ),
            }}
            className="krx-search-input"
          />

          {/* “~로 검색하시겠습니까?” 제안 문구 */}
          {correctionSuggestion && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2">
                '{correctionSuggestion.original}' 대신{" "}
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSearchTerm(correctionSuggestion.corrected);
                    setEffectiveTerm(correctionSuggestion.corrected);
                    setCorrectionSuggestion(null);
                    setPage(1);
                  }}
                >
                  '{correctionSuggestion.corrected}'
                </Typography>
                (으)로 검색하시겠습니까?
              </Typography>
            </Box>
          )}

          {effectiveTerm && (
            <Typography className="krx-search-result">
              검색 결과: <strong>{filteredData.length}</strong>개
            </Typography>
          )}
        </Box>

        {/* 필터 & 즐겨찾기 */}
        <Box
          display="flex"
          gap={2}
          mb={2}
          alignItems="center"
          flexWrap="wrap"
        >
          <TextField
            label="거래량 최소"
            type="number"
            size="small"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                volumeMin: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
          <TextField
            label="시총 최소(억)"
            type="number"
            size="small"
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                marketCapMin: e.target.value
                  ? Number(e.target.value)
                  : null,
              }))
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showFavoritesOnly}
                onChange={() =>
                  setShowFavoritesOnly((prev) => !prev)
                }
              />
            }
            label="즐겨찾기만 보기"
          />
        </Box>

        {/* 탭 */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          centered
          className="krx-tabs"
        >
          <Tab label={`KOSPI (${kospi.length}종목)`} />
          <Tab label={`KOSDAQ (${kosdaq.length}종목)`} />
        </Tabs>

        <Typography className="krx-page-info">
          페이지 {page} / {totalPages} • 총 {sortedData.length}종목
        </Typography>

        {/* 시세표 */}
        <TableContainer component={Paper} className="krx-table-container">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow className="krx-table-head">
                <TableCell align="center">즐겨찾기</TableCell>
                {[
                  "순위",
                  "종목명",
                  "현재가",
                  "전일비",
                  "등락률",
                  "거래량",
                  "거래대금(억)",
                  "시총(억)",
                  "외인",
                  "PER",
                  "ROE",
                ].map((h) => (
                  <TableCell
                    key={h}
                    align="center"
                    onClick={() => {
                      const fieldMap = {
                        현재가: "current_price",
                        거래량: "volume",
                        "거래대금(억)": "tradeAmount",
                        "시총(억)": "market_cap",
                        외인: "foreign_ratio",
                        PER: "per",
                        ROE: "roe",
                        등락률: "change_rate",
                        전일비: "change",
                        종목명: "name",
                      };
                      if (fieldMap[h]) handleSort(fieldMap[h]);
                    }}
                    style={{
                      cursor: h === "순위" ? "default" : "pointer",
                    }}
                  >
                    {h}
                    {sortField ===
                    (() => {
                      const fieldMap = {
                        현재가: "current_price",
                        거래량: "volume",
                        "거래대금(억)": "tradeAmount",
                        "시총(억)": "market_cap",
                        외인: "foreign_ratio",
                        PER: "per",
                        ROE: "roe",
                        등락률: "change_rate",
                        종목명: "name",
                      };
                      return fieldMap[h];
                    })()
                      ? sortOrder === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayData.map((stock, idx) => {
                const isFav = favoriteSet.has(stock.code);
                const rank = (page - 1) * ITEMS_PER_PAGE + idx + 1;

                const isUpRate = stock.change_rate?.includes("+");
                const isDownRate = stock.change_rate?.includes("-");

                return (
                  <TableRow key={stock.code} hover>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          isFav
                            ? "즐겨찾기 제거"
                            : "즐겨찾기 추가"
                        }
                      >
                        <IconButton
                          size="small"
                          onClick={() => toggleFavorite(stock)}
                        >
                          {isFav ? (
                            <StarIcon className="krx-star-filled" />
                          ) : (
                            <StarBorderIcon className="krx-star-empty" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={rank}
                        size="small"
                        className={
                          rank <= 3
                            ? "krx-rank-top"
                            : "krx-rank-normal"
                        }
                      />
                    </TableCell>
                    <TableCell
                      onClick={() => goToDetail(stock)}
                      className="krx-name-cell"
                    >
                      <div className="krx-stock-name">
                        {stock.name}
                      </div>
                      <div className="krx-stock-code">
                        {stock.code}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      {formatPrice(stock.current_price)}
                    </TableCell>
                    <TableCell
                      align="center"
                      className={
                        /상승/.test(stock.change)
                          ? "krx-up"
                          : /상한가/.test(stock.change)
                          ? "krx-up-limit"
                          : /하락/.test(stock.change)
                          ? "krx-down"
                          : /하한가/.test(stock.change)
                          ? "krx-down-limit"
                          : ""
                      }
                    >
                      {stock.change || "-"}
                    </TableCell>
                    <TableCell
                      align="center"
                      className={
                        isUpRate
                          ? "krx-up"
                          : isDownRate
                          ? "krx-down"
                          : ""
                      }
                    >
                      {stock.change_rate || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {formatNumber(stock.volume)}
                    </TableCell>
                    <TableCell align="center">
                      {formatNumber(stock.tradeAmount)}
                    </TableCell>
                    <TableCell align="center">
                      {formatNumber(stock.market_cap)}
                    </TableCell>
                    <TableCell align="center">
                      {stock.foreign_ratio != null
                        ? stock.foreign_ratio.toFixed(1) + "%"
                        : "-"}
                    </TableCell>
                    <TableCell align="center">
                      {stock.per?.toFixed(2) || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {stock.roe != null
                        ? stock.roe.toFixed(2) + "%"
                        : "-"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box className="krx-pagination-wrapper">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Box>
        )}
      </Box>

      {/* 랭킹 사이드바 */}
      <Paper className="krx-ranking-sidebar">
        <Typography className="krx-ranking-title">
          {rankingTypes[rankingTypeIndex].label} Top 10
        </Typography>
        {rankingData.slice(0, 10).map((item, i) => (
          <Box
            key={item.code}
            onClick={() =>
              goToDetail({ code: item.code, name: item.name })
            }
            className="krx-ranking-item"
          >
            <Box className="krx-ranking-item-inner">
              <Box className="krx-ranking-left">
                <Typography className="krx-ranking-rank">
                  {i + 1}
                </Typography>
                <Box>
                  <Typography className="krx-ranking-name">
                    {item.name}
                  </Typography>
                  <Typography className="krx-ranking-code">
                    {item.code}
                  </Typography>
                </Box>
              </Box>
              <Typography className="krx-ranking-amount">
                {formatRankingValue(
                  item,
                  rankingTypes[rankingTypeIndex].field
                )}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

export default KrxList;
