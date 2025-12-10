package com.boot.service;

import java.util.List;
import java.util.Map;

import com.boot.dto.StockNews;

public interface NewsService {

    List<StockNews> searchWithNlp(String query);

    // TF-IDF 랭킹 검색
    List<Map<String, Object>> searchWithTfidfRanking(String query, String category);

    // 챗봇용 요약 (설명 + 상위 1개 뉴스 요약)
    Map<String, Object> searchWithChatSummary(String query);
    
    //오타 교정
    Map<String, Object> getSearchCorrection(String query);

}