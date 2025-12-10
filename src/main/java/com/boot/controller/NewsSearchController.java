package com.boot.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.boot.service.NewsService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/news")
public class NewsSearchController {

    private final NewsService newsService;

    // TF-IDF 랭킹 검색 (카테고리 포함)
    @GetMapping("/search-tfidf")
    public List<Map<String, Object>> searchWithTfidf(
            @RequestParam("q") String query,
            @RequestParam(value = "category", required = false) String category
    ) {
        return newsService.searchWithTfidfRanking(query, category);
    }

    // 챗봇 요약 (원하면 category 추가 가능)
    @GetMapping("/chat-summary")
    public Map<String, Object> getChatSummary(
            @RequestParam("q") String query
    ) {
        return newsService.searchWithChatSummary(query);
    }
    
    @GetMapping("/correct")
    public Map<String, Object> getSearchCorrection(@RequestParam("q") String query) {
        Map<String, Object> correction = newsService.getSearchCorrection(query);
        String original     = (String) correction.getOrDefault("original", query);
        String corrected    = (String) correction.getOrDefault("corrected", query);
        String imeConverted = (String) correction.getOrDefault("ime_converted", query);
        Object alternatives = correction.getOrDefault("alternatives", List.of());
        String type         = (String) correction.getOrDefault("type", "none");

        return Map.of(
                "original", original,
                "corrected", corrected,
                "ime_converted", imeConverted,
                "alternatives", alternatives,
                "type", type
        );
    }
}