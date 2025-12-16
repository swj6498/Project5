package com.boot.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.boot.dao.StockNewsRepository;
import com.boot.dto.StockGlobalNews;
import com.boot.dto.StockNews;
import com.boot.dao.StockGlobalNewsRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockNewsService {

    private final StockNewsRepository stockNewsRepository;
    private final StockGlobalNewsRepository stockGlobalNewsRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String GLOBAL_NEWS_CACHE_KEY = "global:news:list:";
    private static final long CACHE_TTL = 300; // 5분

    /* =========================
       국내 뉴스 (기존 그대로)
       ========================= */
    public Page<StockNews> search(String keyword, String category, int page, int size, String sort) {
        Sort s = "old".equals(sort)
                ? Sort.by(Sort.Direction.ASC, "pubDate")
                : Sort.by(Sort.Direction.DESC, "pubDate");

        Pageable pageable = PageRequest.of(page, size, s);

        if ((keyword == null || keyword.isBlank()) && (category != null && !category.isBlank())) {
            return stockNewsRepository.findByCategory(category, pageable);
        }

        if ((keyword != null && !keyword.isBlank()) && (category != null && !category.isBlank())) {
            return stockNewsRepository
                    .findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCase(
                            category, keyword, category, keyword, pageable);
        }

        return stockNewsRepository.findAll(pageable);
    }

    /* =========================
       🔥 글로벌 뉴스 (Redis 캐시 적용)
       ========================= */
    public Page<StockGlobalNews> getGlobalNews(
            String category,
            int page,
            int size,
            String sort
    ) {
        // 카테고리 필터는 캐시 대상에서 제외 (단순화)
        if (category != null && !category.equals("전체") && !category.isBlank()) {
            return getGlobalNewsFromMongo(category, page, size, sort);
        }

        String order = "asc".equalsIgnoreCase(sort) ? "asc" : "desc";
        String cacheKey = GLOBAL_NEWS_CACHE_KEY + order;

        // ✅ 1. Redis hit
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            List<StockGlobalNews> all = (List<StockGlobalNews>) cached;
            System.out.println("⚡ Redis hit: " + cacheKey);
            return slicePage(all, page, size);
        }
        System.out.println("🐢 Mongo hit: global news query");
        // 🐢 2. Mongo fallback
        Sort s = "asc".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "pubDate")
                : Sort.by(Sort.Direction.DESC, "pubDate");

        List<StockGlobalNews> all =
                stockGlobalNewsRepository.findByRegion("global", s);

        // ✅ 3. Redis 저장
        redisTemplate.opsForValue().set(
                cacheKey,
                all,
                CACHE_TTL,
                java.util.concurrent.TimeUnit.SECONDS
        );
        System.out.println("🧊 Redis set: " + cacheKey);
        return slicePage(all, page, size);
    }

    /* =========================
       글로벌 뉴스 검색 (Mongo 유지)
       ========================= */
    public Page<StockGlobalNews> searchGlobalNews(
            String category,
            String keyword,
            int page,
            int size,
            String sort
    ) {
        Sort s = "asc".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "pubDate")
                : Sort.by(Sort.Direction.DESC, "pubDate");

        List<StockGlobalNews> all;

        if (category == null || category.equals("전체") || category.isBlank()) {
            all = stockGlobalNewsRepository
                    .findByRegionAndTitleContainingIgnoreCase("global", keyword, s);
        } else {
            all = stockGlobalNewsRepository
                    .findByRegionAndSourceIgnoreCaseAndTitleContainingIgnoreCase(
                            "global", category, keyword, s
                    );
        }

        return slicePage(all, page, size);
    }

    /* =========================
       공통 페이징 처리
       ========================= */
    private Page<StockGlobalNews> slicePage(
            List<StockGlobalNews> all,
            int page,
            int size
    ) {
        int start = Math.min(page * size, all.size());
        int end = Math.min(start + size, all.size());
        List<StockGlobalNews> content = all.subList(start, end);

        return new PageImpl<>(
                content,
                PageRequest.of(page, size),
                all.size()
        );
    }

    /* =========================
       카테고리 필터 Mongo 처리
       ========================= */
    private Page<StockGlobalNews> getGlobalNewsFromMongo(
            String category,
            int page,
            int size,
            String sort
    ) {
        Sort s = "asc".equalsIgnoreCase(sort)
                ? Sort.by(Sort.Direction.ASC, "pubDate")
                : Sort.by(Sort.Direction.DESC, "pubDate");

        List<StockGlobalNews> all =
                stockGlobalNewsRepository
                        .findByRegionAndSourceIgnoreCase("global", category, s);

        return slicePage(all, page, size);
    }
}
