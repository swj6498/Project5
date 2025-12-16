package com.boot.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Slice;

import com.boot.dto.StockNews;

public interface NewsService {

    List<StockNews> searchWithNlp(String query);

    // TF-IDF 랭킹 검색
    List<Map<String, Object>> searchWithTfidfRanking(String query, String category);
    
    // 페이징
    Slice<Map<String, Object>> searchWithTfidfSlice(String query, String category, int page, int size);
    
    // 챗봇용 요약 (설명 + 상위 1개 뉴스 요약)
    Map<String, Object> searchWithChatSummary(String query);
    
    //오타 교정
    Map<String, Object> getSearchCorrection(String query);

    // 인기검색어 집계 함수
    List<Map<String, Object>> getTrendingKeywords(int hours);
    
    // 자동검색어
    List<String> getAutocompleteSuggestions(String query);


}
