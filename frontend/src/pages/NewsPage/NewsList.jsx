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

  // 🔵 당신 코드: AI 요약
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const pageSize = 5;
  
  // 🔵 라우팅
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const initialKeyword = params.get("q") || params.get("keyword") || "";
  const initialCategory = params.get("category") || "금융";

  // 🔵 API URL들
  const springBaseUrl = "http://localhost:8585";
  const renderBaseUrl = "https://project5-n56u.onrender.com"; // 친구 코드 URL
  const chatSummaryUrl = "http://localhost:8000/chat-summary";

  const CATEGORY_LIST = [
    "금융", "증권", "산업/재계", "중기/벤처", "글로벌 경제", "생활경제", "경제 일반",
  ];

  // ⭐ 친구 코드: 하이라이트 + 최근본
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

  // 🔵 AI 요약 (당신 코드)
  const fetchAiSummary = async (query) => {
    if (!query.trim()) {
      setAiSummary("");
      return;
    }
    try {
      setSummaryLoading(true);
      const topDoc = items.length > 0 ? {
        title: items[0].title || "",
        content: items[0].content || items[0].description || ""
      } : null;

      const response = await fetch(chatSummaryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), top_doc: topDoc })
      });

      if (!response.ok) throw new Error("AI 요약 요청 실패");
      const data = await response.json();
      setAiSummary(data.summary || "");
    } catch (error) {
      console.error("❌ AI 요약 실패:", error);
      setAiSummary("요약 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // 통합된 fetchNews
  const fetchNews = async (
    category,
    pageNumber = 0,
    query = keyword,
    sortOrder = order
  ) => {
    try {
      setLoading(true);
      const searching = query.trim() !== "";
      setIsSearching(searching);

      let url;
      if (searching) {
        // 🔵 당신 코드: TF-IDF 검색
        const qs = new URLSearchParams();
        qs.append("q", query);
        if (category) qs.append("category", category);
        url = `${springBaseUrl}/api/news/search-tfidf?${qs.toString()}`;
      } else {
        // ⭐ 친구 코드: 일반 목록
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
      fetchNews(activeCategory, 0, initialKeyword, order).then(() => {
        setTimeout(() => fetchAiSummary(initialKeyword), 800);
      });
    }
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialKeyword, initialCategory]);

  // 카테고리 변경 시 자동 fetch
  useEffect(() => {
    fetchNews(activeCategory, 0, keyword, order);
  }, [activeCategory, order]);

  // 🔵 검색 실행
  const handleSearch = () => {
    setPage(0);
    if (keyword.trim() === "") {
      setIsSearching(false);
      fetchNews(activeCategory, 0, "", order);
      setAiSummary("");
    } else {
      setIsSearching(true);
      fetchNews(activeCategory, 0, keyword, order);
      setTimeout(() => fetchAiSummary(keyword), 500);
    }
    // 🔵 URL 업데이트
    const qs = new URLSearchParams();
    qs.append("category", activeCategory);
    if (keyword.trim()) qs.append("q", keyword.trim());
    navigate(`/news?${qs.toString()}`, { replace: true });
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 🔵 카테고리 변경 (당신 코드)
  const handleCategoryChange = (newCategory) => {
    setActiveCategory(newCategory);
    const qs = new URLSearchParams();
    qs.append("category", newCategory);
    if (keyword.trim()) qs.append("q", keyword.trim());
    navigate(`/news?${qs.toString()}`, { replace: true });
  };

  // ⭐ 최근본에서 모달 열기 (친구 코드)
  const openModalFromRecent = (recentNewsItem) => {
    const fullNewsItem = items.find(n =>
      n._id === recentNewsItem._id || n.link === recentNewsItem.link
    );
    if (fullNewsItem) {
      openModal(fullNewsItem);
    }
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

  // ⭐ 최근본 추가 (친구 코드)
  const addToRecentlyViewed = (newsItem) => {
    const newsData = {
      title: newsItem.title,
      media: newsItem.media,
      _id: newsItem._id,
      link: newsItem.link
    };
    setRecentlyViewed(prevList => {
      const filteredList = prevList.filter(item => item.title !== newsData.title);
      return [newsData, ...filteredList].slice(0, MAX_RECENT_ITEMS);
    });
  };

  // 언론사 목록 (친구 코드)
  const MEDIA_COMPANIES = [
    { id: 1, name: "조선일보", logo: "https://via.placeholder.com/30x30/0000FF/FFFFFF?text=CS" },
    { id: 2, name: "중앙일보", logo: "https://via.placeholder.com/30x30/FF0000/FFFFFF?text=JA" },
    { id: 3, name: "동아일보", logo: "https://via.placeholder.com/30x30/008000/FFFFFF?text=DA" },
    { id: 4, name: "경향신문", logo: "https://via.placeholder.com/30x30/FFA500/FFFFFF?text=KH" },
    { id: 5, name: "한국경제", logo: "https://via.placeholder.com/30x30/000000/FFFFFF?text=HK" },
  ];

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

      {/* 🔵 2. 중앙: 뉴스 메인 (합성) */}
      <div className="news-main">
        <div className="news-container">
          {/* 🔵 검색결과 힌트 */}
          {initialKeyword && (
            <div className="search-hint">
              💡 "<strong>{initialKeyword}</strong>" 검색 결과 ({items.length}건)
              {isSearching && <span> 📊 TF-IDF 랭킹 적용됨</span>}
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
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#1e40af" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="#1e40af" strokeWidth="2"/>
              </svg>
            </button>
          </div>

          {/* 🔵 AI 요약 (당신 코드) */}
          {keyword.trim() && (
            <div className="ai-summary-section">
              <div className="ai-summary-header">
                <span className="ai-icon">🤖</span>
                <span>AI 설명</span>
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
                  <div className="ai-summary-text" dangerouslySetInnerHTML={{ __html: aiSummary }} />
                </div>
              ) : (
                <div className="ai-summary-empty">
                  검색어를 입력하면 AI가 간단히 설명해드립니다.
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
            <select
              value={order}
              onChange={(e) => {
                const newOrder = e.target.value;
                setOrder(newOrder);
                setPage(0);
                fetchNews(activeCategory, 0, keyword, newOrder);
              }}
            >
              <option value="desc">🕒 최신순</option>
              <option value="asc">📅 오래된순</option>
            </select>
          </div>

          {/* 뉴스 리스트 */}
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
                      <p
                        className="news-summary"
                        dangerouslySetInnerHTML={{
                          __html: highlightText(
                            n.content
                              ? n.content.length > 150
                                ? n.content.slice(0, 150) + "..."
                                : n.content
                              : n.description || ""
                          ),
                        }}
                      />
                      <div className="news-meta">
                        <div className="left-meta">
                          {n.mediaLogo && <img src={n.mediaLogo} className="media-logo" />}
                          {n.author && <span className="news-author">{n.author}</span>}
                          {n.score != null && (
                            <span className="similarity-score">📊 {(n.score * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <div className="right-meta">
                          {n.pubDate && (
                            <span className="news-date">
                              {new Date(n.pubDate).toLocaleString("ko-KR")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 페이지네이션 */}
          {!isSearching && totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => goToPage(page - 1)} disabled={page === 0}>이전</button>
              <span>{page + 1} / {totalPages}</span>
              <button onClick={() => goToPage(page + 1)} disabled={page + 1 === totalPages}>다음</button>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ 3. 오른쪽 사이드바: 언론사 (친구 코드) */}
      <div className="sidebar-right">
        <div className="sidebar-section media-section">
          <h3 className="sidebar-title">📰 언론사</h3>
          <ul className="media-category-list">
            {MEDIA_COMPANIES.map((company) => (
              <li key={company.id} className="media-item">
                <img src={company.logo} alt={company.name} className="media-logo-sidebar" />
                <span className="media-name">{company.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ⭐ 4. 모달 (친구 코드 + 당신 코드 score 표시) */}
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
                  {selectedNews.mediaLogo && (
                    <img src={selectedNews.mediaLogo} className="media-logo" alt="media" />
                  )}
                  {selectedNews.score != null && (
                    <span className="similarity-score-large">📊 {(selectedNews.score * 100).toFixed(0)}%</span>
                  )}
                  {selectedNews.link && (
                    <a href={selectedNews.link} target="_blank" rel="noreferrer" className="modal-origin-btn">
                      기사원문
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
                  <img src={selectedNews.image_url} alt={selectedNews.title} className="modal-image" />
                </div>
              )}

              <div className="modal-article">
                {selectedNews.content &&
                  selectedNews.content
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
