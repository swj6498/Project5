// src/pages/Main/MainPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // 🔥 라우터 추가
import './MainPage.css';

function MainPage() {
    const [activeTab, setActiveTab] = useState('stock');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();  // 🔥 네비게이션 훅

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        
        console.log(`${activeTab === 'stock' ? '주식' : '뉴스'} 검색:`, searchTerm);
        
        // 🔥 뉴스 탭이면 NewsList로 검색어와 함께 이동
        if (activeTab === 'news') {
            navigate(`/news?category=금융&q=${encodeURIComponent(searchTerm)}`);
            return;
        }
        
        // 주식 탭은 기존 로그만 (나중에 주식 검색 구현시 사용)
        console.log('📈 주식 검색 기능 준비중...');
    };

    return (
        <div className="main-container">
            <h1 className="main-title">Stock & News Search</h1>

            <div className="glass-card">
                <div className="tabs">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`tab ${activeTab === 'stock' ? 'tab-active' : ''}`}
                    >
                        📈 주식 검색
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={`tab ${activeTab === 'news' ? 'tab-active' : ''}`}
                    >
                        📰 뉴스 검색 (TF-IDF)
                    </button>
                </div>

                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={
                            activeTab === 'stock'
                                ? '삼성전자, 애플, 테슬라, 엔비디아...'
                                : '신한금융, 삼성전자, AI, 금리 인상... (형태소분석+TF-IDF 랭킹 적용)'
                        }
                        className="search-input"
                        autoFocus
                    />
                    <button type="submit" className="search-btn">
                        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </form>

                {searchTerm && (
                    <p className="search-hint">
                        💡 뉴스 탭에서 검색하면 <strong>TF-IDF 랭킹 + 형태소분석 + 유사도 점수</strong>가 적용됩니다!
                    </p>
                )}
            </div>

            <p className="bottom-text">
                실시간 주가 정보와 최신 금융 뉴스를 한곳에서 (TF-IDF 검색 엔진 완성!)
            </p>
        </div>
    );
}

export default MainPage;