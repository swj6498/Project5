// src/pages/Main/MainPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next"; // i18next 훅
import './MainPage.css';

function MainPage() {
    const { t } = useTranslation(); // 번역 함수
    const [activeTab, setActiveTab] = useState('stock');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
		const q = searchTerm.trim();
		if (!q) return;
        
        console.log(`${activeTab === 'stock' ? '주식' : '뉴스'} 검색:`, q);
        
        if (activeTab === 'news') {
            navigate(`/news?category=금융&q=${encodeURIComponent(q)}`);
            return;
        }

        if (activeTab === 'stock') {
            // 🌟 주목: '/krx/list' 경로로 이동하며 검색어 'q'를 쿼리 파라미터로 전달
            navigate(`/krx/list?q=${encodeURIComponent(q)}`);
            return;
        }
    };

    return (
        <div className="main-container">
            <h1 className="main-title">{t("mainTitle")}</h1>

            <div className="glass-card">
                <div className="tabs">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`tab ${activeTab === 'stock' ? 'tab-active' : ''}`}
                    >
                        {t("tabStock")}
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={`tab ${activeTab === 'news' ? 'tab-active' : ''}`}
                    >
                        {t("tabNews")}
                    </button>
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={activeTab === 'stock' ? t("placeholderStock") : t("placeholderNews")}
                        className="search-input"
                        autoFocus
                    />
                    <button type="submit" className="search-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
}

export default MainPage;
