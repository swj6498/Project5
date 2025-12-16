package com.boot.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.boot.dao.SearchLogRepository;
import com.boot.dao.StockNewsRepository;
import com.boot.dto.NewsTerm;
import com.boot.dto.StockNews;

@Service
public class NewsServiceImpl implements NewsService {

    private final StockNewsRepository stockNewsRepository;
    private final NlpService nlpService;
    private final SearchLogRepository searchLogRepository;
    private final MongoTemplate mongoTemplate;
    private final Map<String, List<Map<String, Object>>> tfidfCache = new ConcurrentHashMap<>();

    // 🔵 FastAPI 연동용 RestTemplate & 기본 URL
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_BASE_URL = "http://localhost:8000";

    public NewsServiceImpl(
            StockNewsRepository stockNewsRepository,
            NlpService nlpService,
            MongoTemplate mongoTemplate,
            SearchLogRepository searchLogRepository
    ) {
        this.stockNewsRepository = stockNewsRepository;
        this.nlpService = nlpService;
        this.mongoTemplate = mongoTemplate;
        this.searchLogRepository = searchLogRepository;
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
                        .limit(100)
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
    
 // 인기 검색어 (최근 n시간 집계)
    @Override
    public List<Map<String, Object>> getTrendingKeywords(int hours) {

        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        Date sinceDate = Date.from(since.atZone(ZoneId.systemDefault()).toInstant());

        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(
                        Criteria.where("timestamp").gte(sinceDate)
                ),
                Aggregation.group("keyword")
                        .count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.limit(50) 
        );

        AggregationResults<Map> results =
                mongoTemplate.aggregate(agg, "search_log", Map.class);

        List<Map<String, Object>> rawList = results.getMappedResults().stream()
                .map(m -> Map.of(
                        "keyword", m.get("_id"),
                        "count", m.get("count")
                ))
                .toList();

        return rawList.stream()
                .map(m -> Map.of(
                        "keyword", m.get("keyword"),
                        "count", m.get("count")
                ))
                .limit(5)
                .toList();
    }
    
    @Override
    public List<String> getAutocompleteSuggestions(String query) {
        // 'query'와 일치하는 term을 찾기 위한 MongoDB 쿼리
        Query searchQuery = new Query();
        searchQuery.addCriteria(Criteria.where("term").regex(query, "i"));  // 대소문자 구분 없이 검색
        searchQuery.limit(10);  // 최대 10개만 가져오기

        // 검색 결과
        List<NewsTerm> results = mongoTemplate.find(searchQuery, NewsTerm.class, "news_terms");

        // 결과에서 term만 추출하여 리스트로 반환
        return results.stream()
                      .map(NewsTerm::getTerm)  // getTerm() 메서드 사용
                      .collect(Collectors.toList());
    }
    
    @Override
    public Slice<Map<String, Object>> searchWithTfidfSlice(
            String query,
            String category,
            int page,
            int size
    ) {
        String cacheKey =
                query.trim().toLowerCase()
                + "::"
                + (category == null ? "" : category.trim());

        List<Map<String, Object>> allResults = tfidfCache.get(cacheKey);
        if (allResults == null) {
            allResults = searchWithTfidfRanking(query, category);

            if (tfidfCache.size() >= 100) {
                tfidfCache.clear();
            }
            tfidfCache.put(cacheKey, allResults);
        }

        int start = page * size;
        int end = Math.min(start + size + 1, allResults.size());

        List<Map<String, Object>> content =
                start >= allResults.size()
                        ? List.of()
                        : new ArrayList<>(allResults.subList(start, end));

        boolean hasNext = content.size() > size;
        if (hasNext) content.remove(size);

        return new SliceImpl<>(
                content,
                PageRequest.of(page, size),
                hasNext
        );
    }


}
