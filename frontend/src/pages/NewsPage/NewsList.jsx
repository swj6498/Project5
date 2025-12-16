import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewsList.css";
import { useTranslation } from "react-i18next";

function NewsList() {
	const { t } = useTranslation();

	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);

	// ⭐ 친구 코드: 최근본 기사 + 모달
	const [selectedNews, setSelectedNews] = useState(null);
	const [activeCategory, setActiveCategory] = useState("금융");
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [keyword, setKeyword] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const getDefaultOrder = () => {
	  return isSearching || keyword.trim() ? "accuracy" : "desc";
	};
	const [order, setOrder] = useState(getDefaultOrder());

	// 🔵 AI 요약 상태 (chat_summary_lib 연동)
	const [aiSummary, setAiSummary] = useState(null); // ✅ 객체로 변경
	const [summaryLoading, setSummaryLoading] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	// 🔵 오타 교정 상태
	const [correction, setCorrection] = useState(null);
	// ⭐ 거래대금 Top5 (추가)
	const [tradeRanking, setTradeRanking] = useState([]);
	const [isRankingOpen, setIsRankingOpen] = useState(true);
	//드롭다운
	const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
	// 인기 검색어
	const [trendingKeywords, setTrendingKeywords] = useState([]);
	// 검색 드롭다운
	const [showDropdown, setShowDropdown] = useState(false);
	// 자동완성
	const [autoKeywords, setAutoKeywords] = useState([]);
	const [setSearchKeyword] = useState("");
	// 자동완성 선택 인덱스
	const [activeAutoIndex, setActiveAutoIndex] = useState(-1);

	const pageSize = 5;

	// 🔵 라우팅
	const location = useLocation();
	const navigate = useNavigate();
	const params = new URLSearchParams(location.search);
	const initialKeyword = params.get("q") || params.get("keyword") || "";
	const initialCategory = params.get("category") || "금융";

	// 🔵 API URL들
	const springBaseUrl = "http://localhost:8585";
	const renderBaseUrl = "https://project5-n56u.onrender.com";
	const fastApiBaseUrl = "http://localhost:8000";
	
	const SEARCH_CACHE = new Map();
	const CACHE_TTL = 30000; // 30초

	const CATEGORY_LIST = [
		"금융", "증권", "산업/재계", "중기/벤처", "글로벌 경제", "생활경제", "경제 일반",
	];
	// 자동완성
	const fetchAutocomplete = async (q) => {
		const trimmed = (q || "").trim();
		if (!trimmed) {
			setAutoKeywords([]);
			return;
		}

		try {
			const res = await fetch(
				`${springBaseUrl}/api/news/autocomplete?query=${encodeURIComponent(trimmed)}`
			);
			if (!res.ok) throw new Error("autocomplete error");
			const data = await res.json();
			setAutoKeywords(data || []);
		} catch (e) {
			console.error("❌ autocomplete error", e);
			setAutoKeywords([]);
		}
	};

	// ⭐ 친구 코드: 하이라이트
	const highlightText = (text) => {
		if (!keyword || !text) return text;
		const pattern = new RegExp(
			`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
			"gi"
		);
		return text.replace(pattern, `<span class="highlight">$1</span>`);
	};

	// ⭐ 최근본 기사 (친구 코드)
	const RECENT_KEY = 'stockNews_recentlyViewed';
	const MAX_RECENT_ITEMS = 5;
	const [recentlyViewed, setRecentlyViewed] = useState(() => {
		try {
			const saved = localStorage.getItem(RECENT_KEY);
			return saved ? JSON.parse(saved) : [];
		} catch (error) {
			console.error("Failed to load recent news from localStorage:", error);
			return [];
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
		} catch (error) {
			console.error("Failed to save recent news to localStorage:", error);
		}
	}, [recentlyViewed]);

	// ⭐ 거래대금 랭킹 Top5 불러오기 (30초마다 갱신) - 추가
	useEffect(() => {
		const loadRanking = () => {
			fetch(`${springBaseUrl}/api/krx/ranking/trade`)
				.then((res) => res.json())
				.then((data) => setTradeRanking(data || []))
				.catch(() => { });
		};
		loadRanking();
		const id = setInterval(loadRanking, 30000);
		return () => clearInterval(id);
	}, []);

	// 인기검색어
	const fetchTrendingKeywords = async () => {
		try {
			const res = await fetch(`${springBaseUrl}/api/news/trending?hours=24`);
			const data = await res.json();
			setTrendingKeywords(data || []);
		} catch (err) {
			console.error("❌ 인기검색어 로드 실패:", err);
		}
	};

	// 🔵 AI 요약 (chat_summary_lib 완벽 연동)
	const fetchAiSummary = async (query) => {
		if (!query?.trim()) {
			setAiSummary(null);
			return;
		}

		try {
			setSummaryLoading(true);

			const response = await fetch(`${fastApiBaseUrl}/chat-summary`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ query: query.trim() }),
			});

			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const aiData = await response.json();

			// ✅ ChatSummaryResponse 그대로 저장
			setAiSummary(aiData);

		} catch (error) {
			console.error("❌ AI 분석 실패:", error);
			setAiSummary({
				query,
				summary: "AI 서버 연결 오류 (localhost:8000 확인)",
				is_stock_related: false,
				model_used: "error",
				explanation_type: "error"
			});
		} finally {
			setSummaryLoading(false);
		}
	};

	// 🔵 오타 교정 API 호출
	const fetchCorrection = async (q) => {
		const trimmed = (q || "").trim();
		if (!trimmed || trimmed.length < 2) {
			setCorrection(null);
			return;
		}

		try {
			// FastAPI news-search-correction 호출 (IME + 뉴스 교정 통합)
			const res = await fetch(
				`${fastApiBaseUrl}/news-search-correction?q=${encodeURIComponent(trimmed)}`
			);
			if (!res.ok) throw new Error("correction error");
			const data = await res.json();

			// news.corrected와 original 비교해서 correction 설정
			if (data.news && data.news.corrected !== trimmed) {
				setCorrection({
					original: trimmed,
					corrected: data.news.corrected,
					source: data.news.source
				});
			} else {
				setCorrection(null);
			}
		} catch (e) {
			console.error("❌ correction error", e);
			setCorrection(null);
		}
	};


	// 거래대금/랭킹 값 포맷 (국내 주식페이지와 동일 로직)
	const formatRankingValue = (item, field) => {
		const value = item[field];
		if (value == null) return "-";

		if (["score", "mixedScore"].includes(field)) {
			const val = Number(value) / 1e8; // 원 → 억
			return (val > 0 ? Math.floor(val) : val).toLocaleString() + t("hundredMillion");
		}

		if (["marketCap"].includes(field)) {
			const val = Number(value);
			return (val > 0 ? Math.floor(val) : val).toLocaleString() + t("hundredMillion");
		}

		if (field === "volume") {
			return Number(value).toLocaleString();
		}

		if (field === "changeRate") {
			return value.toString();
		}

		const val = Number(value);
		return (val > 0 ? Math.floor(val) : val).toLocaleString();
	};


	// 🔵 상단에 캐시 상태 추가 (기존 state들 다음에)
	const fetchNews = async (category, pageNumber = 0, query = keyword, sortOrder = order) => {
	  try {
	    setLoading(true);
	    
	    const searching = query.trim() !== "";  // ✅ 맨 위로 이동
	    
	    // ✅ 검색 캐시 키 생성 (searching 먼저 정의)
	    const cacheKey = searching ? `search:${query.trim()}:${category}:${sortOrder}` : null;
	    
	    // ✅ 캐시 HIT 확인
	    if (searching && cacheKey) {
	      const cached = SEARCH_CACHE.get(cacheKey);
	      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
	        console.log("✅ 캐시 HIT:", cacheKey);
	        setItems(cached.data);
	        setPage(0);
	        setTotalPages(1);
	        setLoading(false);
	        return;
	      }
	    }

	    let url;
	    
	    if (searching) {
	      const qs = new URLSearchParams();
	      qs.append("q", query);
	      if (category) qs.append("category", category);
	      url = `${springBaseUrl}/api/news/search-tfidf?${qs.toString()}`;
	    } else {
	      url = `${renderBaseUrl}/news?category=${encodeURIComponent(category)}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`;
	    }

	    console.log("🔍 API 호출:", url);
	    const res = await fetch(url);
	    if (!res.ok) throw new Error(`HTTP ${res.status}`);
	    const data = await res.json();

	    if (searching) {
	      let sortedItems = [...(data || [])];
	      
	      if (sortOrder === "accuracy") {
	        sortedItems.sort((a, b) => (b.score || 0) - (a.score || 0));
	      } else if (sortOrder === "desc") {
	        sortedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
	      } else if (sortOrder === "asc") {
	        sortedItems.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
	      }
	      
	      // ✅ 캐시 저장
	      if (cacheKey) {
	        SEARCH_CACHE.set(cacheKey, {
	          data: sortedItems,
	          timestamp: Date.now()
	        });
	        console.log("✅ 캐시 저장:", cacheKey, sortedItems.length, "개");
	      }
	      
	      setItems(sortedItems);
	      setPage(0);
	      setTotalPages(1);
	    } else {
	      setItems(data.content || []);
	      setPage(data.number || 0);
	      setTotalPages(data.totalPages || 1);
	    }
	  } catch (e) {
	    console.error("❌ 뉴스 가져오기 실패:", e);
	    setIsSearching(false);
	  } finally {
	    setLoading(false);
	  }
	};

	// 🔵 초기 로드
	useEffect(() => {
		if (initialKeyword) {
			setKeyword(initialKeyword);
			setIsSearching(true);
			setOrder("accuracy");
			setAiSummary(null);
			setCorrection(null);

			fetchNews(initialCategory || activeCategory, 0, initialKeyword, "accuracy");

			setTimeout(() => {
				fetchAiSummary(initialKeyword);
				fetchCorrection(initialKeyword);  // 한글 오타 교정 강제 실행
			}, 500);

		} else {
			// 검색어 없을 때 기본 카테고리 뉴스
			setOrder("desc");
			fetchNews(initialCategory || activeCategory, 0, "", "desc");
			setAiSummary(null);
			setCorrection(null);
		}

		if (initialCategory) {
			setActiveCategory(initialCategory);
		}

		// 🔵 초기 로드 완료 후 false로 변경 (중복 방지)
		setIsInitialLoad(false);
	}, [initialKeyword, initialCategory, isInitialLoad]); // ✅ isInitialLoad 의존성 추가

	useEffect(() => {
	  if (keyword.trim()) {
	    fetchNews(activeCategory, 0, keyword, order);
	  } else {
	    fetchNews(activeCategory, 0, "", order);
	  }
	}, [activeCategory, order, keyword]);


	// 🔵 인기 검색어 초기 로드
	useEffect(() => {
		fetchTrendingKeywords();
	}, []);

	// 자동완성 바뀌면 초기화
	useEffect(() => {
		setActiveAutoIndex(-1);
	}, [autoKeywords]);
	// 🔵 선택적 재검색
	const handleReSearch = async (term) => {
		const t = (term || "").trim();
		if (!t) return;
		
		setKeyword(t);
		setPage(0);
		setIsSearching(true);
		setOrder("accuracy");
		await fetchNews(activeCategory, 0, t, "accuracy");
		  
		fetchAiSummary(t);
		fetchCorrection(t);

		const qs = new URLSearchParams();
		qs.append("category", activeCategory);
		qs.append("q", t);
		navigate(`/news?${qs.toString()}`, { replace: true });
	};

	// 🔵 검색 실행
	const handleSearch = async (overrideKeyword) => {
		const q = (overrideKeyword ?? keyword).trim();
		setPage(0);

		if (!q) {
			setIsSearching(false);
			setSearchKeyword("");
			setOrder("desc");
			setAiSummary(null);
			setCorrection(null);
			fetchNews(activeCategory, 0, "", "desc");
		} else {
			setIsSearching(true);
			setSearchKeyword(q);      // 항상 정확한 검색어
			setOrder("accuracy");
			await fetchNews(activeCategory, 0, q, "accuracy");
			fetchCorrection(q);
			setTimeout(() => fetchAiSummary(q), 500);
		}

		const qs = new URLSearchParams();
		qs.append("category", activeCategory);
		if (q) qs.append("q", q);
		navigate(`/news?${qs.toString()}`, { replace: true });
	};

	const handleCategoryChange = (newCategory) => {
		setActiveCategory(newCategory);
		if (!keyword.trim()) {
			const qs = new URLSearchParams();
			qs.append("category", newCategory);
			navigate(`/news?${qs.toString()}`, { replace: true });
		}
	};

	// ⭐ 모달/최근본 함수들 (변경없음)
	const openModalFromRecent = (recentNewsItem) => {
		setSelectedNews(recentNewsItem);   // 바로 모달에 넣기
	};

	const openModal = (news) => {
		setSelectedNews(news);
		addToRecentlyViewed(news);
	};

	const closeModal = () => setSelectedNews(null);

	const goToPage = (pageNumber) => {
		if (pageNumber < 0 || pageNumber >= totalPages) return;
		fetchNews(activeCategory, pageNumber, keyword, order);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const addToRecentlyViewed = (newsItem) => {
		const newsData = {
			title: newsItem.title,
			media: newsItem.media,
			_id: newsItem._id,
			link: newsItem.link,
			content: newsItem.content,
			image_url: newsItem.image_url,
			mediaLogo: newsItem.mediaLogo,
			pubDate: newsItem.pubDate,
			score: newsItem.score,
			author: newsItem.author,
		};
		setRecentlyViewed(prevList => {
			const filteredList = prevList.filter(item => item.title !== newsData.title);
			return [newsData, ...filteredList].slice(0, MAX_RECENT_ITEMS);
		});
	};

	const listToShow = items;

	return (
		<div className="layout-container">
			{/* ⭐ 1. 왼쪽 사이드바: 최근 본 기사 (친구 코드) */}
			<div className="sidebar-left">
				<div className="sidebar-section">
					<h3 className="sidebar-title">{t("news_2.recentViewed")}</h3>
					<ul className="recent-list">
						{recentlyViewed.length > 0 ? (
							recentlyViewed.map((news, index) => (
								<li
									key={news._id || index}
									className="recent-item"
									onClick={() => openModalFromRecent(news)}
								>
									<span className="recent-media">{news.media}</span>
									<p className="recent-title">{news.title}</p>
								</li>
							))
						) : (
							<li className="recent-item" style={{ cursor: 'default', padding: '8px' }}>
								<p className="recent-title" style={{ color: '#888' }}>{t("news_2.noRecent")}</p>
							</li>
						)}
					</ul>
				</div>
			</div>

			{/* 🔵 2. 중앙: 뉴스 메인 */}
			      <div className="news-main">
			        <div className="news-container">

			          {/* 검색창 */}
			          <div className="search-box">
			            <input
			              type="text"
			              placeholder={t("news_2.searchPlaceholder")}
			              value={keyword}
			              onChange={(e) => {
			                const v = e.target.value;
			                setKeyword(v);            // 입력만
			                setShowDropdown(true);
			                fetchAutocomplete(v);    // 자동완성만
			              }}
			              onFocus={() => setShowDropdown(true)}  // ★ 포커스 시 열기
			              onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // ★ 포커스 벗어나면 닫기
			              onKeyDown={(e) => {
			                if (!showDropdown || autoKeywords.length === 0) {
			                  if (e.key === "Enter") {
			                    handleSearch();
			                    setShowDropdown(false); // ✅ 추가: 드롭다운이 닫히도록
			                  }
			                  return;
			                }

			                if (e.key === "ArrowDown") {
			                  e.preventDefault();
			                  setActiveAutoIndex((prev) =>
			                    prev < autoKeywords.length - 1 ? prev + 1 : 0
			                  );
			                }

			                if (e.key === "ArrowUp") {
			                  e.preventDefault();
			                  setActiveAutoIndex((prev) =>
			                    prev > 0 ? prev - 1 : autoKeywords.length - 1
			                  );
			                }

			                if (e.key === "Enter") {
			                  e.preventDefault();
			                  if (activeAutoIndex >= 0) {
			                    const selected = autoKeywords[activeAutoIndex];
			                    setKeyword(selected);
			                    handleSearch(selected);
			                    setShowDropdown(false);
			                  } else {
			                    handleSearch();
			                    setShowDropdown(false);
			                  }
			                }

			                if (e.key === "Escape") {
			                  setShowDropdown(false);
			                  setActiveAutoIndex(-1);
			                }
			              }}
			            />
						{showDropdown && (autoKeywords.length > 0 || trendingKeywords.length > 0) && (
							<div className="keyword-dropdown">

								{/* 🔍 자동완성 검색어 */}
								{autoKeywords.map((word, idx) => (
									<div
										key={`auto-${idx}`}
										className={`dropdown-item autocomplete ${idx === activeAutoIndex ? "active" : ""
											}`}
										onMouseEnter={() => setActiveAutoIndex(idx)}
										onMouseDown={() => {
											setKeyword(word);
											handleSearch(word);
											setShowDropdown(false);
										}}
									>
										🔎 {word}
									</div>
								))}

								{/* 🔥 인기 검색어 TOP5 */}
								{trendingKeywords.slice(0, 6).map((k, idx) => (
									<div
										key={`trend-${idx}`}
										className="dropdown-item"
										onMouseDown={() => {
											setKeyword(k.keyword);
											handleSearch(k.keyword);
										}}
									>
										📈 {k.keyword}
									</div>
								))}
							</div>
						)}
						<button
							type="button"
							className="icon-btn"
							onMouseDown={() => handleSearch()}
						>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#1e40af" strokeWidth="2" />
								<path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2" />
							</svg>
						</button>
					</div>

					{/* 🔵 오타 교정 바 */}
					{correction && (
						<div className="correction-bar">
							<span>혹시 이런 단어를 찾으셨나요?</span>
							<button
								type="button"
								className="correction-link"
								onClick={() => handleReSearch(correction.corrected)}
								style={{ marginLeft: 4, marginRight: 4 }}
							>
								[{correction.corrected}]
							</button>
							<span className="correction-original">
								(입력한 단어: {correction.original})
							</span>
						</div>
					)}

					{/* 🔵 ✅ 완전 수정: AI 요약 UI */}
					{keyword.trim() && (
						<div className="ai-summary-section">
							<div className="ai-summary-header">
								<span>AI {t("news_2.analysis")}</span>
								{summaryLoading && <span className="summary-loading">{t("common.loading")}</span>}
							</div>

							{summaryLoading ? (
								<div className="ai-summary-loading">
									<div className="loading-dots">
										<span></span><span></span><span></span>
									</div>
								</div>
							) : aiSummary ? (
								<div className="ai-summary-content">
									{/* ✅ 요약 내용 */}
									<div className="ai-text">{aiSummary.summary}</div>

									{/* ✅ 메타 정보 */}
									<div className="ai-meta">
										<small>
											{t("news_2.model")}: {aiSummary.model_used} | {t("news_2.explainType")}: {aiSummary.explanation_type}
										</small>
									</div>
								</div>
							) : (
								<div className="ai-summary-empty">
									검색 결과 분석 준비중...
								</div>
							)}
						</div>
					)}

					{/* 카테고리 탭 */}
					<div className="category-tabs">
						{CATEGORY_LIST.map((cat) => (
							<button
								key={cat}
								className={cat === activeCategory ? "active" : ""}
								onClick={() => handleCategoryChange(cat)}
							>
								{t(`category.${cat}`)}
							</button>
						))}
					</div>

					<div className="search-divider"></div>

					{/* 정렬 */}
					<div
						className="sort-dropdown-container" // 컨테이너 역할
						onBlur={() => setTimeout(() => setIsSortDropdownOpen(false), 200)} // 외부 클릭 시 닫기 위한 처리
					>
						{/* 1. 현재 선택된 값을 보여주는 버튼 (드롭다운 트리거) */}
						<button
							className="sort-dropdown-trigger"
							onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
						>
						{order === 'accuracy' ? t("news_2.sortAccuracy") : 
						 order === 'desc' ? t("news_2.sortLatest") : t("news_2.sortOldest")}
							<span className="dropdown-arrow">{isSortDropdownOpen ? '▲' : '▼'}</span>
						</button>

						{/* 2. 실제 펼쳐지는 목록 (CSS로 둥글게 처리할 부분) */}
						{isSortDropdownOpen && (
							<ul className="sort-dropdown-menu">
								{/* 정확도순 (검색 결과에만 표시) */}
								<li
								  className={order === 'accuracy' ? 'active' : ''}
								  style={{ display: isSearching || keyword.trim() ? 'block' : 'none' }}
								  onClick={() => {
								    setOrder('accuracy');
								    setPage(0);
								    fetchNews(activeCategory, 0, keyword, 'accuracy');
								    setIsSortDropdownOpen(false);
								  }}
								>
								  {t("news_2.sortAccuracy")}
								</li>
								{/* 최신순 */}
								<li
									className={order === 'desc' ? 'active' : ''}
									onClick={() => {
										setOrder('desc');
										setPage(0);
										fetchNews(activeCategory, 0, keyword, 'desc');
										setIsSortDropdownOpen(false); // 닫기
									}}
								>
									{t("news_2.sortLatest")}
								</li>
								{/* 오래된순 */}
								<li
									className={order === 'asc' ? 'active' : ''}
									onClick={() => {
										setOrder('asc');
										setPage(0);
										fetchNews(activeCategory, 0, keyword, 'asc');
										setIsSortDropdownOpen(false); // 닫기
									}}
								>
									{t("news_2.sortOldest")}
								</li>
							</ul>
						)}
					</div>

					{/* 뉴스 리스트 + 모달 + 페이지네이션 + 언론사 (변경없음) */}
					{loading ? (
						<p className="loading-message">{t("common.loadingNews")}</p>
					) : listToShow.length === 0 ? (
						<p className="empty-message">
							{isSearching
								? t("news_2.noResult", { keyword })
								: t("news_2.noNews")
							}
						</p>
					) : (
						<ul className="news-list">
							{listToShow.map((n, idx) => (
								<li key={n._id || n.link || idx} className="news-card" onClick={() => openModal(n)}>
									<div className="news-content">
										{n.image_url ? (
											<div className="news-image-wrapper">
												<img src={n.image_url} alt={n.title} className="news-image" />
											</div>
										) : (
											<div className="news-image-wrapper placeholder">{t("news_2.noImage")}</div>
										)}
										<div className="news-text">
											<h3 dangerouslySetInnerHTML={{ __html: highlightText(n.title || "") }} />
											<p className="news-summary" dangerouslySetInnerHTML={{
												__html: highlightText(n.content ? n.content.length > 150 ? n.content.slice(0, 150) + "..." : n.content : n.description || "")
											}} />
											<div className="news-meta">
												<div className="left-meta">
													{n.mediaLogo && <img src={n.mediaLogo} className="media-logo" alt="logo" />}
													{n.author && <span className="news-author">{n.author}</span>}
													{n.score != null && <span className="similarity-score">📊 {(n.score * 100).toFixed(0)}%</span>}
												</div>
												<div className="right-meta">
													{n.pubDate && <span className="news-date">{new Date(n.pubDate).toLocaleString("ko-KR")}</span>}
												</div>
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}

					{!isSearching && totalPages > 1 && (
						<div className="pagination">
							<button onClick={() => goToPage(page - 1)} disabled={page === 0}>{t("prev")}</button>
							<span>{page + 1} / {totalPages}</span>
							<button onClick={() => goToPage(page + 1)} disabled={page + 1 === totalPages}>{t("next")}</button>
						</div>
					)}
				</div>
			</div>

			{/* ⭐ 3. 오른쪽 사이드바 */}
			<div className="sidebar-right">
						    
						    {/* 1. ✅ 변경: 급상승 검색어 섹션 (토글 없이 항상 표시) */}
							{trendingKeywords.length > 0 && (
							        <div className="sidebar-section trending-list-box"> 
							            
							            {/* ⭐⭐⭐ 이 부분을 아래와 같이 수정합니다 ⭐⭐⭐ */}
							            <div className="ranking-header-with-date">
							                <h3 className="sidebar-title" style={{ margin: 0, borderBottom: 'none', padding: 0 }}>🔥 인기 검색어</h3> 
							                <span className="update-datetime">
							                    {new Date().toLocaleString("ko-KR", { 
							                        month: '2-digit', 
							                        day: '2-digit', 
							                        hour: '2-digit', 
							                        minute: '2-digit', 
							                        hour12: false, 
							                    })} 
							                </span>
							            </div>
							            {/* ⭐⭐⭐ 수정 끝 ⭐⭐⭐ */}
							            
							            <ul className="keyword-list always-open"> 
							                {trendingKeywords.slice(0, 10).map((k, idx) => (
							                    <li
							                        key={idx}
							                        className="keyword-item"
							                        onClick={() => {
							                            setKeyword(k.keyword);
							                            handleSearch(k.keyword);
							                        }}
							                    >
							                        {/* ⭐ 변경: 순위 표시 형태를 '1위'로 변경 */}
							                        <span className="keyword-rank">{idx + 1}위</span> 
							                        <span className="keyword-text">{k.keyword}</span>
							                    </li>
							                ))}
							            </ul>
							        </div>
							    )}
						    
						    {/* 2. ✅ 변경: 거래대금 Top5 섹션 (토글형 유지) */}
						    <div className="sidebar-section ranking-toggle-box" style={{ marginTop: trendingKeywords.length > 0 ? '15px' : '0' }}>
						        {/* 토글 헤더 (클릭 시 토글) */}
						        <div className="ranking-toggle-header" onClick={() => setIsRankingOpen(!isRankingOpen)}>
						            <h3 className="toggle-title">{t("topValueTitle")}</h3>
						            <button
						                className="toggle-button"
						            >
						                {isRankingOpen ? '▲' : '▼'}
						            </button>
						        </div>

						        {/* 토글 콘텐츠 */}
						        <div className={`ranking-toggle-content ${isRankingOpen ? 'open' : ''}`}>
						            <ul className="stock-ranking-list">
						                {tradeRanking.slice(0, 5).map((item, i) => (
						                    <li
						                        key={item.code || i}
						                        className="stock-ranking-item"
						                        onClick={() => navigate(`/krx/${item.code}`)}
						                    >
						                        <div className="stock-ranking-left">
						                            <span className="stock-ranking-rank">{t("rank", { num: i + 1 })}</span>
						                            <div className="stock-ranking-name">{item.name}</div>
						                        </div>
						                        <div className="stock-ranking-amount">
						                            {formatRankingValue(item, "score")}
						                        </div>
						                    </li>
						                ))}
						                {tradeRanking.length === 0 && (
						                    <li className="stock-ranking-item" style={{ justifyContent: 'center', cursor: 'default' }}>
						                        <div className="stock-ranking-name" style={{ color: '#888' }}>{t("common.noData")}</div>
						                    </li>
						                )}
						            </ul>
						        </div>
						    </div>

						</div>

			{/* ⭐ 4. 모달 (변경없음) */}
			{selectedNews && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2
								className="modal-title"
								dangerouslySetInnerHTML={{ __html: selectedNews.title || "" }}
							/>
							<button className="modal-close-btn" onClick={closeModal}>×</button>
						</div>
						<div className="modal-body">
							<div className="modal-meta">
								<div className="left-meta">
									{selectedNews.mediaLogo && <img src={selectedNews.mediaLogo} className="media-logo" alt="media" />}
									{/* ✅ 작성자 표시 */}
									{selectedNews.author && (
										<span className="news-author">{selectedNews.author}</span>
									)}
									{selectedNews.link && <a href={selectedNews.link} target="_blank" rel="noreferrer" className="modal-origin-btn">기사원문</a>}
								</div>
								<div className="right-meta">
									{selectedNews.pubDate && <span className="news-date">{new Date(selectedNews.pubDate).toLocaleString("ko-KR")}</span>}
								</div>
							</div>
							{selectedNews.image_url && (
								<div className="modal-image-wrapper">
									<img src={selectedNews.image_url} alt={selectedNews.title} className="modal-image" />
								</div>
							)}
							<div className="modal-article">
								{selectedNews.content && selectedNews.content
									.replace(/<br\s*\/?>/gi, "\n")
									.split(/\n\s*\n|<\/p>/)
									.map((paragraph, idx) => {
										const cleanText = paragraph.replace(/<\/?p>/gi, "").trim();
										if (!cleanText) return null;
										return (
											<div key={idx} className="article-paragraph">
												<div className="paragraph-bar" />
												<div className="article-text" dangerouslySetInnerHTML={{ __html: cleanText }} />
											</div>
										);
									})}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default NewsList;
