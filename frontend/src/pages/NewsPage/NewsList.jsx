import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewsList.css";

function NewsList() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);

	// ⭐ 친구 코드: 최근본 기사 + 모달
	const [selectedNews, setSelectedNews] = useState(null);
	const [activeCategory, setActiveCategory] = useState("금융");
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [keyword, setKeyword] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [order, setOrder] = useState("desc");

	// 🔵 완전 수정: AI 요약 상태 (chat_summary_lib 연동)
	const [aiSummary, setAiSummary] = useState(null); // ✅ 객체로 변경
	const [summaryLoading, setSummaryLoading] = useState(false);

	// 🔵 오타 교정 상태
	const [correction, setCorrection] = useState(null);

	// ⭐ 거래대금 Top5 (추가)
	const [tradeRanking, setTradeRanking] = useState([]);

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

	const CATEGORY_LIST = [
		"금융", "증권", "산업/재계", "중기/벤처", "글로벌 경제", "생활경제", "경제 일반",
	];

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



	// 🔵 ✅ 완전 수정: AI 요약 (chat_summary_lib 완벽 연동)
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
		if (!trimmed) {
			setCorrection(null);
			return;
		}

		// ✅ 영문/숫자/공백만 있는 경우에만 교정 API 호출
		const englishOnlyRegex = /^[A-Za-z0-9\s]+$/;
		if (!englishOnlyRegex.test(trimmed)) {
			// 한글/특수문자 섞여 있으면 교정 기능 스킵
			setCorrection(null);
			return;
		}

		try {
			const res = await fetch(
				`${springBaseUrl}/api/news/correct?q=${encodeURIComponent(trimmed)}`
			);
			if (!res.ok) throw new Error("correction error");
			const data = await res.json();
			if (data.corrected && data.original && data.corrected !== data.original) {
				setCorrection(data);
			} else {
				setCorrection(null);
			}
		} catch (e) {
			console.error("❌ correction error", e);
			setCorrection(null);
		}
	};

	// 통합된 fetchNews
	const fetchNews = async (category, pageNumber = 0, query = keyword, sortOrder = order) => {
		try {
			setLoading(true);
			const searching = query.trim() !== "";
			setIsSearching(searching);

			let url;
			if (searching) {
				const qs = new URLSearchParams();
				qs.append("q", query);
				if (category) qs.append("category", category);
				url = `${springBaseUrl}/api/news/search-tfidf?${qs.toString()}`;
			} else {
				url = `${renderBaseUrl}/news?category=${encodeURIComponent(category)}&page=${pageNumber}&size=${pageSize}&order=${sortOrder}`;
			}

			const res = await fetch(url);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();

			if (searching) {
				setItems(data || []);
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
		    fetchNews(initialCategory || activeCategory, 0, initialKeyword, order);
		    // ❌ 여기서는 fetchAiSummary / fetchCorrection 호출 안 함
		  } else {
		    // 검색어 없을 때 기본 카테고리 뉴스
		    fetchNews(initialCategory || activeCategory, 0, "", order);
		  }
		if (initialCategory) {
			setActiveCategory(initialCategory);
		}
	}, [initialKeyword, initialCategory]);

	useEffect(() => {
		fetchNews(activeCategory, 0, keyword, order);
	}, [activeCategory, order]);

	// 🔵 선택적 재검색
	const handleReSearch = (term) => {
		const t = (term || "").trim();
		if (!t) return;
		setKeyword(t);
		setPage(0);
		setIsSearching(true);
		fetchNews(activeCategory, 0, t, order);
		fetchAiSummary(t);
		fetchCorrection(t);

		const qs = new URLSearchParams();
		qs.append("category", activeCategory);
		qs.append("q", t);
		navigate(`/news?${qs.toString()}`, { replace: true });
	};

	// 🔵 검색 실행
	const handleSearch = () => {
		setPage(0);
		if (keyword.trim() === "") {
			setIsSearching(false);
			fetchNews(activeCategory, 0, "", order);
			setAiSummary(null);
			setCorrection(null);
		} else {
			setIsSearching(true);
			fetchNews(activeCategory, 0, keyword, order);
			setTimeout(() => fetchAiSummary(keyword), 500);
			fetchCorrection(keyword);
		}
		const qs = new URLSearchParams();
		qs.append("category", activeCategory);
		if (keyword.trim()) qs.append("q", keyword.trim());
		navigate(`/news?${qs.toString()}`, { replace: true });
	};

	const handleEnter = (e) => e.key === "Enter" && handleSearch();

	const handleCategoryChange = (newCategory) => {
		setActiveCategory(newCategory);
		const qs = new URLSearchParams();
		qs.append("category", newCategory);
		if (keyword.trim()) qs.append("q", keyword.trim());
		navigate(`/news?${qs.toString()}`, { replace: true });
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
					<h3 className="sidebar-title">⭐ 최근 본 기사</h3>
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
								<p className="recent-title" style={{ color: '#888' }}>아직 본 기사가 없습니다.</p>
							</li>
						)}
					</ul>
				</div>
			</div>

			{/* 🔵 2. 중앙: 뉴스 메인 */}
			<div className="news-main">
				<div className="news-container">

					{/* 🔵 오타 교정 바 */}
					{correction && (
						<div className="correction-bar">
							<span>다음에 대한 검색 결과 표시 중 </span>
							<button type="button" className="correction-link" onClick={() => handleReSearch(correction.corrected)}>
								[{correction.corrected}]
							</button>
							<span> 처음에 검색한 결과 </span>
							<button type="button" className="original-link" onClick={() => handleReSearch(correction.original)}>
								[{correction.original}]
							</button>
						</div>
					)}

					{/* 검색창 */}
					<div className="search-box">
						<input
							type="text"
							placeholder="삼성전자, 애플, 엔비디아..."
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							onKeyDown={handleEnter}
						/>
						<button className="icon-btn" onClick={handleSearch}>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#1e40af" strokeWidth="2" />
								<path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2" />
							</svg>
						</button>
					</div>

					{/* 🔵 ✅ 완전 수정: AI 요약 UI */}
					{keyword.trim() && (
						<div className="ai-summary-section">
							<div className="ai-summary-header">
								<span className="ai-icon">🤖</span>
								<span>AI 분석</span>
								{summaryLoading && <span className="summary-loading">생성중...</span>}
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
											모델: {aiSummary.model_used} | 타입: {aiSummary.explanation_type}
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
								{cat}
							</button>
						))}
					</div>

					<div className="search-divider"></div>

					{/* 정렬 */}
					<div className="sort-dropdown">
						<select value={order} onChange={(e) => {
							const newOrder = e.target.value;
							setOrder(newOrder);
							setPage(0);
							fetchNews(activeCategory, 0, keyword, newOrder);
						}}>
							<option value="desc">🕒 최신순</option>
							<option value="asc">📅 오래된순</option>
						</select>
					</div>

					{/* 뉴스 리스트 + 모달 + 페이지네이션 + 언론사 (변경없음) */}
					{loading ? (
						<p className="loading-message">뉴스 로딩중...</p>
					) : listToShow.length === 0 ? (
						<p className="empty-message">
							{isSearching ? `❌ "${keyword}" 검색 결과 없음` : "아직 뉴스가 없어요"}
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
											<div className="news-image-wrapper placeholder">이미지 없음</div>
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
							<button onClick={() => goToPage(page - 1)} disabled={page === 0}>이전</button>
							<span>{page + 1} / {totalPages}</span>
							<button onClick={() => goToPage(page + 1)} disabled={page + 1 === totalPages}>다음</button>
						</div>
					)}
				</div>
			</div>

			{/* ⭐ 3. 오른쪽 사이드바: 거래대금 Top 5 */}
			<div className="sidebar-right">
				<div className="sidebar-section stock-ranking-section">
					<h3 className="sidebar-title">📊 거래대금 Top 5</h3>
					<ul className="stock-ranking-list">
						{tradeRanking.slice(0, 5).map((item, i) => (
							<li
								key={item.code || i}
								className="stock-ranking-item"
								// 필요하면 종목 상세로 이동
								onClick={() => navigate(`/krx/${item.code}`)}
							>
								<div className="stock-ranking-left">
									<span className="stock-ranking-rank">{i + 1}위</span>
									<div className="stock-ranking-name">{item.name}</div>
								</div>
								<div className="stock-ranking-amount">
									{item.score?.toLocaleString()}억
								</div>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* ⭐ 4. 모달 (변경없음) */}
			{selectedNews && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2 dangerouslySetInnerHTML={{ __html: selectedNews.title || "" }} />
							<button className="modal-close-btn" onClick={closeModal}>×</button>
						</div>
						<div className="modal-body">
							<div className="modal-meta">
								<div className="left-meta">
									{selectedNews.mediaLogo && <img src={selectedNews.mediaLogo} className="media-logo" alt="media" />}
									{selectedNews.score != null && <span className="similarity-score-large">📊 {(selectedNews.score * 100).toFixed(0)}%</span>}
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
