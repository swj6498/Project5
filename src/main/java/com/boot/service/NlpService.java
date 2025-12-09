package com.boot.service;

import java.util.List;
import java.util.Map;

public interface NlpService {

    List<String> analyzeQuery(String query);

    List<Map<String, Object>> rankWithTfidf(String query, List<Map<String, Object>> documents);

    Map<String, Object> getSummary(Map<String, Object> request);

    // 새로 추가: 챗봇용 요약 (설명 + 상위 1개 뉴스)
    Map<String, Object> getChatSummary(Map<String, Object> request);
}
