// src/pages/NewsPage/GlobalNews.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NewsList.css";
import { useTranslation } from "react-i18next";

function GlobalNews() {
	const { t } = useTranslation();
	const MEDIA_LOGOS = {
		CNBC: "https://upload.wikimedia.org/wikipedia/commons/e/e3/CNBC_logo.svg",
		CNN: "https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg",
		BBC: "https://i.namu.wiki/i/_OhuuEOZy3SVA9-nVBijBMBIzQzhcQ4Q2pfDmSRkOYV3QW74TtQknwuhCOIf86BUMCHjt6BQHa8jv5SJzMOH9DAh2PG37pqouSZrWKTkiFQ2chDJLFMmoPv-t03O6wmRcK3_S8zG6K8QwdptRqZObA.svg",
		"Yahoo Finance":
			"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Yahoo%21_Finance_logo_2021.png/250px-Yahoo%21_Finance_logo_2021.png",
	};
	// 🌐 번역 상태
	const [translatedText, setTranslatedText] = useState(null);
	const [translating, setTranslating] = useState(false);

	const springBaseUrl = "http://localhost:8585";
	const CATEGORIES = ["all", "CNBC", "CNN", "BBC", "Yahoo Finance"];
	const RECENT_KEY = "stockNews_recentlyViewed";
	const pageSize = 10;

	const location = useLocation();
	const navigate = useNavigate();
	const params = new URLSearchParams(location.search);

	const initialCategory = params.get("category") || "all";
	const initialKeyword = params.get("q") || "";

	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedNews, setSelectedNews] = useState(null);
	const [page, setPage] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [order, setOrder] = useState("desc");
	const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
	const [keyword, setKeyword] = useState(initialKeyword);
	const [activeCategory, setActiveCategory] = useState(initialCategory);
	const [searchMode, setSearchMode] = useState(!!initialKeyword); // 검색중인지 여부

	const [recentlyViewed, setRecentlyViewed] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
		} catch {
			return [];
		}
	});

	// 📄 기본 목록 조회 (카테고리 + 정렬 + 페이징)
	const fetchNews = async (category, pageNumber = 0, sortOrder = order) => {
		try {
			    setLoading(true);
			    setSearchMode(false);

			    const isAll = !category || category === "all";

			    const url =
			      `${springBaseUrl}/news/global` +
			      `?page=${pageNumber}` +
			      `&size=${pageSize}` +
			      `&sort=${sortOrder}` +
			      (isAll ? "" : `&category=${encodeURIComponent(category)}`);

			    const res = await fetch(url);
			    const data = await res.json();

			    setItems(data.content || []);
			    setPage(data.number ?? 0);
			    setTotalPages(data.totalPages ?? 1);
			  } catch (e) {
			    console.error("❌ 해외 뉴스 로드 실패:", e);
			    setItems([]);
			    setPage(0);
			    setTotalPages(1);
			  } finally {
			    setLoading(false);
			  }
	};

	// 🔍 검색 API 호출 (카테고리 + 키워드)
	const fetchSearchResults = async (query, category = activeCategory, pageNumber = 0) => {
		const trimmed = query.trim();
		if (!trimmed) {
			fetchNews(category, 0, order);
			return;
		}

		try {
			setLoading(true);
			setSearchMode(true);

			const targetCategory = category || "all";

			const url =
				`${springBaseUrl}/news/global/search?` +
				`q=${encodeURIComponent(trimmed)}` +
				`&category=${encodeURIComponent(targetCategory)}` +
				`&sort=${order}` +
				`&page=${pageNumber}` +
				`&size=${pageSize}`;

			const res = await fetch(url);
			const data = await res.json();

			setItems(data.content || []);
			setPage(data.number ?? 0);
			setTotalPages(data.totalPages ?? 1);

		} catch (e) {
			console.error("❌ 해외 뉴스 검색 실패:", e);
			setItems([]);
			setPage(0);
			setTotalPages(1);
		} finally {
			setLoading(false);
		}
	};



	// 최초 로드 및 URL 바뀔 때
	useEffect(() => {
		// URL 쿼리에서 category, q 동기화
		const urlCategory = params.get("category") || "all";
		const urlKeyword = params.get("q") || "";

		setActiveCategory(urlCategory);
		setKeyword(urlKeyword);

		if (urlKeyword.trim()) {
			fetchSearchResults(urlKeyword, urlCategory);
		} else {
			fetchNews(urlCategory, 0, order);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.search]);

	// 정렬만 바뀔 때 (검색 모드/목록 모드에 따라 분기)
	useEffect(() => {
		if (searchMode) {
			if (keyword.trim()) {
				fetchSearchResults(keyword, activeCategory);
			}
		} else {
			fetchNews(activeCategory, page, order);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [order]);

	const handleCategoryChange = (newCat) => {
		setActiveCategory(newCat);

		const qs = new URLSearchParams();
		qs.append("region", "global");
		qs.append("category", newCat);
		if (keyword.trim()) qs.append("q", keyword);

		navigate(`/news?${qs.toString()}`, { replace: true });

		// 실제 데이터 로드는 useEffect(location.search)에서 처리됨
	};

	const handleSearchClick = () => {
		const qs = new URLSearchParams();
		qs.append("region", "global");
		qs.append("category", activeCategory);
		if (keyword.trim()) qs.append("q", keyword);

		navigate(`/news?${qs.toString()}`, { replace: true });
		// 역시 데이터 로드는 useEffect(location.search)에서
	};

	const resolveMediaLogo = (news) => {
		const source = news.source || news.media || "";

		return (
			MEDIA_LOGOS[source] ||
			(source.includes("BBC") ? MEDIA_LOGOS.BBC : null) ||
			(source.includes("Yahoo") && source.includes("Finance")
				? MEDIA_LOGOS["Yahoo Finance"]
				: null) ||
			null
		);
	};

	const goToPage = (p) => {
		if (p < 0 || p >= totalPages) return;
		setPage(p);

		if (searchMode) {
			fetchSearchResults(keyword, activeCategory, p);
		} else {
			fetchNews(activeCategory, p, order);
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleTranslate = async () => {
		if (!selectedNews?.content) return;

		try {
			setTranslating(true);
			setTranslatedText(null);

			const res = await fetch(
				"https://project5-1-a3p0.onrender.com/translate",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						text: selectedNews.content,
					}),
				}
			);

			if (!res.ok) throw new Error("translate failed");

			const data = await res.json();
			setTranslatedText(data.translated);

		} catch (e) {
			console.error("❌ 번역 실패", e);
			setTranslatedText("번역 중 오류가 발생했습니다.");
		} finally {
			setTranslating(false);
		}
	};
	const openModal = (news) => {
		const source = news.source || news.media || "";

		const normalized = {
			title: news.title,
			content: news.content,
			link: news.link,
			image_url: news.image_url,
			mediaLogo: resolveMediaLogo(news),
			author: news.author || "",
			pubDate: news.pubDate || news.publishedAt || null,
			source,
		};

		setSelectedNews(normalized);
		addToRecentlyViewed(normalized);


	};

	useEffect(() => {
		if (selectedNews) {
			setTranslatedText(null);
			setTranslating(false);
		}
	}, [selectedNews]);

	const closeModal = () => setSelectedNews(null);

	const addToRecentlyViewed = (news) => {
		const source = news.source || news.media || "";


		const data = {
			title: news.title,
			media: source,
			source,
			_id: news._id,
			link: news.link,
			mediaLogo: resolveMediaLogo(news),                 // ✅ 통일
			author: news.author || "",
			pubDate: news.pubDate || news.publishedAt || null,
			image_url: news.image_url,
			content: news.content,
		};

		setRecentlyViewed((prev) => {
			const updated = [data, ...prev.filter((i) => i.title !== data.title)].slice(0, 5);
			localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
			return updated;
		});
	};


	return (
		<div className="layout-container">
			{/* 🔹 왼쪽: 최근 본 기사 */}
			<div className="sidebar-left">
				<div className="sidebar-section">
					<h3 className="sidebar-title">{t("globalNews.recentViewed")}</h3>
					<ul className="recent-list">
						{recentlyViewed.map((news, i) => (
							<li
								key={i}
								className="recent-item"
								onClick={() => openModal(news)}
							>
								<span className="recent-media">{news.media}</span>
								<p className="recent-title">{news.title}</p>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* 🔹 중앙: 해외 뉴스 메인 */}
			<div className="news-main">
				<div className="news-container">
					{/* 🔍 검색창 */}
					<div className="search-box">
						<input
							type="text"
							placeholder={t("globalNews.placeholder")}
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleSearchClick();
							}}
						/>
						<button className="icon-btn search-icon-btn" onClick={handleSearchClick}>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<path
									d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
									stroke="#1e40af"
									strokeWidth="2"
								/>
								<path
									d="M21 21L16.65 16.65"
									stroke="#1e40af"
									strokeWidth="2"
								/>
							</svg>
						</button>
					</div>

					{/* 카테고리 탭 */}
					<div className="category-tabs">
						{CATEGORIES.map((cat) => (
							<button
								key={cat}
								className={cat === activeCategory ? "active" : ""}
								onClick={() => handleCategoryChange(cat)}
								>
								{cat === "all" ? t("all") : cat}
							</button>
						))}
					</div>

					<div className="search-divider"></div>

					{/* 정렬 드롭다운 */}
					<div className="sort-dropdown-container">
						<button
							className="sort-dropdown-trigger"
							onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
						>
							{order === "desc" ? t("globalNews.sort.latest") : t("globalNews.sort.oldest")}
							<span className="dropdown-arrow">{isSortDropdownOpen ? '▲' : '▼'}</span>
						</button>
						{isSortDropdownOpen && (
							<ul className="sort-dropdown-menu">
								<li
									onClick={() => {
										setOrder("desc");
										setIsSortDropdownOpen(false);
									}}
								>
									{t("globalNews.sort.latest")}
								</li>
								<li
									onClick={() => {
										setOrder("asc");
										setIsSortDropdownOpen(false);
									}}
								>
									{t("globalNews.sort.oldest")}
								</li>
							</ul>
						)}
					</div>

					{/* 리스트 / 로딩 / 빈 결과 */}
					{loading ? (
						<p className="loading-message">{t("globalNews.loading")}</p>
					) : items.length === 0 ? (
						<p className="empty-message">{t("globalNews.empty")}</p>
					) : (
						<ul className="news-list">
							{items.map((n, i) => (
								<li key={i} className="news-card" onClick={() => openModal(n)}>
									<div className="news-content">
										{n.image_url ? (
											<img src={n.image_url} className="news-image" alt="" />
										) : (
											<div className="news-image-wrapper placeholder">IMG</div>
										)}
										<div className="news-text">
											<h3>{n.title}</h3>
											<p className="news-summary">
												{n.content?.substring(0, 120)}...
											</p>
											<div className="news-meta">
												<div className="left-meta">
													{/* 🔹 언론사 로고 */}
													{MEDIA_LOGOS[n.source] && (
														<img
															src={MEDIA_LOGOS[n.source]}
															alt={n.source}
															className="media-logo"
														/>
													)}
													{/* 원하면 텍스트는 빼거나 남겨두기 */}
													{/* <span style={{ fontWeight: "bold", marginLeft: "6px", color: "blue" }}>
																  					                                  {n.source}
																  					                                </span> */}
												</div>
												<span>
													{n.pubDate &&
														new Date(n.pubDate).toLocaleString("ko-KR")}
												</span>
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}

					{/* 페이지네이션 (검색 모드일 때는 1페이지만) */}
					{!searchMode && totalPages > 1 && (
						<div className="pagination">
							<button onClick={() => goToPage(page - 1)} disabled={page === 0}>
								{t("globalNews.pagination.prev")}
							</button>
							<span>
								{page + 1} / {totalPages}
							</span>
							<button
								onClick={() => goToPage(page + 1)}
								disabled={page + 1 >= totalPages}
							>
								{t("globalNews.pagination.next")}
							</button>
						</div>
					)}
				</div>
			</div>

			<div className="sidebar-right"></div>

			{/* 모달 */}
			{selectedNews && (
				<div className="modal-overlay" onClick={closeModal}>
					<div className="modal-content" onClick={(e) => e.stopPropagation()}>
						<div className="modal-header">
							<h2>{selectedNews.title}</h2>
							<div style={{ display: "flex", gap: "8px" }}>
								<button
									className="translate-btn"
									onClick={handleTranslate}
									disabled={translating}
								>
									🌐 한글 번역
								</button>

								<button className="modal-close-btn" onClick={closeModal}>×</button>
							</div>
						</div>


						<div className="modal-body">
							<div className="modal-meta">
								<div className="left-meta">
									{resolveMediaLogo(selectedNews) && (
										<img
											src={resolveMediaLogo(selectedNews)}
											alt={selectedNews.source}
											className="media-logo"
										/>
									)}

									{selectedNews.author && (
										<span className="news-author">{selectedNews.author}</span>
									)}

									{selectedNews.link && (
										<a
											href={selectedNews.link}
											target="_blank"
											rel="noreferrer"
											className="modal-origin-btn"
										>
											{t("globalNews.original")}
										</a>
									)}
								</div>

								<div className="right-meta">
									{selectedNews.pubDate && (
										<span className="news-date">
											{new Date(selectedNews.pubDate).toLocaleString("ko-KR")}
										</span>
									)}
								</div>
							</div>

							{selectedNews.image_url && (
								<div className="modal-image-wrapper">
									<img
										src={selectedNews.image_url}
										alt=""
										className="modal-image"
									/>
								</div>
							)}

							<div className="modal-article">
								{selectedNews.content &&
									selectedNews.content
										.split(/\n|\r/)
										.map((paragraph, idx) => {
											const clean = paragraph.trim();
											if (!clean) return null;
											return (
												<div key={idx} className="article-paragraph">
													<div className="paragraph-bar" />
													<div className="article-text">{clean}</div>
												</div>
											);
										})}
								{translating && (
									<div style={{ marginTop: 16, fontStyle: "italic" }}>
										번역중...
									</div>
								)}

								{translatedText && (
									<div
										className="translated-box"
										style={{
											marginTop: 20,
											padding: 16,
											background: "#f8f9fa",
											borderRadius: 8,
										}}
									>
										<h4 style={{ marginBottom: 8 }}>🔎 번역 결과</h4>
										<p style={{ whiteSpace: "pre-line" }}>{translatedText}</p>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default GlobalNews;
