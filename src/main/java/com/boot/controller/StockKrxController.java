// src/main/java/com/boot/controller/StockKrxController.java
package com.boot.controller;

import com.boot.dto.*;
import com.boot.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class StockKrxController {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;
    private final RecentStockService recentStockService;
    private final RankingService rankingService;
    private final FavoriteStockService favoriteStockService;
    private final StockCacheService stockCacheService;
    private final StockDetailService stockDetailService;

// ==================== 즐겨찾기 API ====================

    // 즐겨찾기 목록 조회
    @GetMapping("/krx/favorites")
    public List<StockSimpleDTO> getFavorites() {
        String userId = getCurrentUserId();  // 아래에 있는 메서드 사용
        return favoriteStockService.getFavorites(userId);
    }

    // 즐겨찾기 추가
    @PostMapping("/krx/favorites/add")
    public ResponseEntity<Void> addFavorite(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String name = body.get("name");
        if (code == null || name == null) {
            return ResponseEntity.badRequest().build();
        }
        favoriteStockService.addFavorite(getCurrentUserId(), code, name);
        return ResponseEntity.ok().build();
    }

    // 즐겨찾기 삭제
    @DeleteMapping("/krx/favorites/remove")
    public ResponseEntity<Void> removeFavorite(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null) {
            return ResponseEntity.badRequest().build();
        }
        favoriteStockService.removeFavorite(getCurrentUserId(), code);
        return ResponseEntity.ok().build();
    }

    // 현재 로그인한 사용자 ID 가져오기 (JWT 기반)
    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())
                ? auth.getName()
                : "guest";  // 로그인 안 된 경우 (테스트용)
    }

    // ---------- 기존 메서드 (캐시 적용) ----------
    @GetMapping("/krx/kospi/list")
    public List<Map<String, Object>> getKospiList() {
        return stockCacheService.getKospiList();
    }

    @GetMapping("/krx/kosdaq/list")
    public List<Map<String, Object>> getKosdaqList() {
        return stockCacheService.getKosdaqList();
    }

    // ---------- 종목 상세 ----------
    @GetMapping("/krx/detail/{code}")
    public Object getStockDetail(@PathVariable String code) {
        StockKospiDTO kospi = kospiService.findByCode(code);
        if (kospi != null) return kospi;
        return kosdaqService.findByCode(code);
    }

    // 뉴스 API
    @GetMapping("/krx/news/{code}")
    public List<StockDetailNewsDTO> getNews(@PathVariable String code) {
        return stockDetailService.getNews(code);
    }

    // 차트 이미지 URL API
    // type = "area" (선차트) | "candle" (봉차트)
    // period = "day", "week", "month", "month3", "year", "year3", "year5", "year6"
    @GetMapping("/krx/chart/{code}")
    public Map<String, String> getChart(
            @PathVariable String code,
            @RequestParam(defaultValue = "area") String type,
            @RequestParam(defaultValue = "day") String period
    ) {
        String url = stockDetailService.getChartUrl(code, type, period);
        return Map.of("imgUrl", url);
    }

    // 주요 시세 정보 API
    @GetMapping("/krx/price/{code}")
    public StockPriceInfoDTO getPriceInfo(@PathVariable String code) {
        return stockDetailService.getPriceInfo(code);
    }

    // ---------- 최근 본 종목 ----------
    @PostMapping("/krx/recent/add")
    public ResponseEntity<Void> addRecentStock(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String name = body.get("name");
        if (code != null && name != null) {
            recentStockService.addRecentStock(code, name);
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/krx/recent")
    public List<StockSimpleDTO> getRecentStocks() {
        return recentStockService.getRecentStocks();
    }

    // 거래대금 Top 10
    @GetMapping("/krx/ranking/trade")
    public List<RankingDTO> getTradeRanking() {
        return rankingService.getTopByTradeAmount();
    }

    // 거래량 Top 10
    @GetMapping("/krx/ranking/volume")
    public List<RankingDTO> getVolumeRanking() {
        return rankingService.getTopByVolume();
    }

    // 등락률 Top 10
    @GetMapping("/krx/ranking/change")
    public List<RankingDTO> getChangeRanking() {
        return rankingService.getTopByChangeRate();
    }

    // 시가총액 Top 10
    @GetMapping("/krx/ranking/market")
    public List<RankingDTO> getMarketCapRanking() {
        return rankingService.getTopByMarketCap();
    }

    // 혼합점수 Top 10
    @GetMapping("/krx/ranking/mixed")
    public List<RankingDTO> getMixedRanking() {
        return rankingService.getTopByMixedScore();
    }

}