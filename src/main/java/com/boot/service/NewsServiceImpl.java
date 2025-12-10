package com.boot.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.boot.dao.StockNewsRepository;
import com.boot.dto.StockNews;

@Service
public class NewsServiceImpl implements NewsService {

    private final StockNewsRepository stockNewsRepository;
    private final NlpService nlpService;

    // 🔵 FastAPI 연동용 RestTemplate & 기본 URL
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_BASE_URL = "http://localhost:8000";

    public NewsServiceImpl(StockNewsRepository stockNewsRepository, NlpService nlpService) {
        this.stockNewsRepository = stockNewsRepository;
        this.nlpService = nlpService;
    }

    @Override
    public List<StockNews> searchWithNlp(String query) {
        var tokens = nlpService.analyzeQuery(query);
        if (tokens.isEmpty()) {
            return stockNewsRepository
                    .findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCase(
                            "", query, "", query, null
                    )
                    .getContent();
        }
        String main = tokens.get(0);
        return stockNewsRepository
                .findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCase(
                        "", main, "", main, null
                )
                .getContent();
    }

    // TF-IDF 랭킹용 (카테고리 반영 + StockNews 필드 merge)
    @Override
    public List<Map<String, Object>> searchWithTfidfRanking(String query, String category) {
        long start = System.currentTimeMillis();
        try {
            System.out.println("🔵 searchWithTfidfRanking start: query=" + query + ", category=" + category);

            long t0 = System.currentTimeMillis();
            var tokens = nlpService.analyzeQuery(query);
            long t1 = System.currentTimeMillis();
            System.out.println("⏱ analyzeQuery took " + (t1 - t0) + " ms, tokens=" + tokens);

            if (tokens.isEmpty()) {
                System.out.println("🔵 tokens empty → return []");
                System.out.println("⏱ TOTAL searchWithTfidfRanking took " +
                        (System.currentTimeMillis() - start) + " ms");
                return List.of();
            }

            // 1) 카테고리별 후보 StockNews 조회
            long tMongoStart = System.currentTimeMillis();
            List<StockNews> candidates;
            if (category == null || category.isBlank()) {
                candidates = stockNewsRepository
                        .findAll()
                        .stream()
                        .limit(200)
                        .collect(Collectors.toList());
            } else {
                var pageable = PageRequest.of(
                        0,
                        200,
                        Sort.by(Sort.Direction.DESC, "pubDate")
                );
                candidates = stockNewsRepository
                        .findByCategory(category, pageable)
                        .getContent();
            }
            long tMongoEnd = System.currentTimeMillis();
            System.out.println("⏱ Mongo candidate query took " +
                    (tMongoEnd - tMongoStart) + " ms, size=" + candidates.size());

            System.out.println("🔵 candidates size=" + candidates.size());
            if (candidates.isEmpty()) {
                System.out.println("🔵 no candidates → return []");
                System.out.println("⏱ TOTAL searchWithTfidfRanking took " +
                        (System.currentTimeMillis() - start) + " ms");
                return List.of();
            }

            // 2) TF-IDF 스크립트에 넘길 최소 정보(id, title, content)
            long tPrepStart = System.currentTimeMillis();
            List<Map<String, Object>> docsForTfidf = candidates.stream()
                    .map(doc -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", doc.getId());
                        m.put("title", doc.getTitle());
                        m.put("content", doc.getContent());
                        return m;
                    })
                    .collect(Collectors.toList());
            long tPrepEnd = System.currentTimeMillis();
            System.out.println("⏱ docsForTfidf prepare took " +
                    (tPrepEnd - tPrepStart) + " ms, size=" + docsForTfidf.size());

            System.out.println("🔵 docs prepared size=" + docsForTfidf.size());

            // 3) TF-IDF 랭킹 결과 (id, title, content, score)
            long tRankStart = System.currentTimeMillis();
            List<Map<String, Object>> ranked = nlpService.rankWithTfidf(query, docsForTfidf);
            long tRankEnd = System.currentTimeMillis();
            System.out.println("⏱ rankWithTfidf (FastAPI) took " +
                    (tRankEnd - tRankStart) + " ms");

            System.out.println("🔵 ranked size=" + (ranked != null ? ranked.size() : -1));
            if (ranked == null || ranked.isEmpty()) {
                System.out.println("⏱ TOTAL searchWithTfidfRanking took " +
                        (System.currentTimeMillis() - start) + " ms");
                return List.of();
            }

            // 4) ranked.id 기준으로 원본 StockNews 와 merge
            long tMergeStart = System.currentTimeMillis();
            Map<String, StockNews> byId = candidates.stream()
                    .collect(Collectors.toMap(StockNews::getId, n -> n, (a, b) -> a));

            List<Map<String, Object>> merged = new ArrayList<>();
            for (Map<String, Object> r : ranked) {
                String id = (String) r.get("id");
                Double score = (Double) r.get("score");
                StockNews sn = byId.get(id);
                if (sn == null) continue;

                Map<String, Object> m = new HashMap<>();
                m.put("id", sn.getId());
                m.put("title", sn.getTitle());
                m.put("content", sn.getContent());
                m.put("author", sn.getAuthor());
                m.put("media", sn.getMedia());
                m.put("mediaLogo", sn.getMediaLogo());
                m.put("image_url", sn.getImage_url());
                m.put("link", sn.getLink());
                m.put("pubDate", sn.getPubDate());
                m.put("category", sn.getCategory());
                m.put("score", score);

                merged.add(m);
            }
            long tMergeEnd = System.currentTimeMillis();
            System.out.println("⏱ merge ranked+StockNews took " +
                    (tMergeEnd - tMergeStart) + " ms, mergedSize=" + merged.size());

            System.out.println("⏱ TOTAL searchWithTfidfRanking took " +
                    (System.currentTimeMillis() - start) + " ms");
            return merged;

        } catch (Exception e) {
            System.err.println("❌ searchWithTfidfRanking ERROR");
            e.printStackTrace();
            System.out.println("⏱ TOTAL searchWithTfidfRanking took " +
                    (System.currentTimeMillis() - start) + " ms (with ERROR)");
            return List.of();
        }
    }

    // 챗봇 요약
    @Override
    public Map<String, Object> searchWithChatSummary(String query) {
        List<Map<String, Object>> ranked = searchWithTfidfRanking(query, null);

        if (ranked.isEmpty()) {
            return Map.of(
                    "summary", "관련 뉴스 없이 기본 정보만 제공합니다.",
                    "query", query,
                    "news_count", 0,
                    "top_doc", null
            );
        }

        Map<String, Object> top1 = ranked.get(0);

        Map<String, Object> req = new HashMap<>();
        req.put("query", query);
        req.put("top_doc", top1);

        return nlpService.getChatSummary(req);
    }

    // 🔵 오타 교정 / 대체 검색어 제안 (FastAPI /search-correction 연동)
    @Override
    public Map<String, Object> getSearchCorrection(String query) {
        try {
            var uri = UriComponentsBuilder
                    .fromHttpUrl(FASTAPI_BASE_URL + "/search-correction")
                    .queryParam("q", query)
                    .build(true)
                    .toUri();

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(uri, Map.class);

            if (resp == null) {
                return Map.of(
                        "original", query,
                        "corrected", query,
                        "ime_converted", query,
                        "alternatives", List.of(),
                        "type", "none"
                );
            }

            return Map.of(
                    "original", resp.getOrDefault("original", query),
                    "corrected", resp.getOrDefault("corrected", query),
                    "ime_converted", resp.getOrDefault("ime_converted", query),
                    "alternatives", resp.getOrDefault("alternatives", List.of()),
                    "type", "ime_fuzzy"
            );
        } catch (Exception e) {
            System.err.println("❌ getSearchCorrection ERROR: " + e.getMessage());
            return Map.of(
                    "original", query,
                    "corrected", query,
                    "ime_converted", query,
                    "alternatives", List.of(),
                    "type", "error"
            );
        }
    }
}
