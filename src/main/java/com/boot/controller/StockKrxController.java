// src/main/java/com/boot/controller/StockApiController.java
package com.boot.controller;

import com.boot.dto.*;
import com.boot.service.*;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
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

    // 1. KOSPI 목록
    @GetMapping("/krx/kospi/list")
    public List<StockKospiDTO> getKospiList() {
        return kospiService.findAll();
    }

    // 2. KOSDAQ 목록
    @GetMapping("/krx/kosdaq/list")
    public List<StockKosdaqDTO> getKosdaqList() {
        return kosdaqService.findAll();
    }

    // 3. 종목 상세 정보 (KOSPI + KOSDAQ 통합)
    @GetMapping("/krx/detail/{code}")
    public Object getStockDetail(@PathVariable String code) {
        StockKospiDTO kospi = kospiService.findByCode(code);
        if (kospi != null) return kospi;
        return kosdaqService.findByCode(code);
    }

    // 4. 뉴스 크롤링
    @GetMapping("/krx/news/{code}")
    public List<DetailNewsDTO> getNews(@PathVariable String code) {
        try {
            Document doc = Jsoup.connect("https://finance.naver.com/item/main.naver?code=" + code)
                    .userAgent("Mozilla/5.0")
                    .timeout(10000)
                    .get();

            Elements items = doc.select(".sub_section.news_section li");
            List<DetailNewsDTO> news = new ArrayList<>();

            for (Element item : items) {
                Element titleEl = item.selectFirst(".txt a:first-child");
                if (titleEl == null) continue;

                DetailNewsDTO n = new DetailNewsDTO();
                n.setTitle(titleEl.text().trim());
                n.setLink("https://finance.naver.com" + titleEl.attr("href"));

                Elements emTags = item.select("em");
                String date = "";
                String related = null;

                for (Element em : emTags) {
                    if (em.parent() != null && em.parent().classNames().contains("link_relation")) {
                        related = em.text().trim();
                    } else {
                        date = em.text().trim();
                    }
                }

                n.setDate(date.isEmpty() ? "최근" : date);
                n.setRelated(related);
                news.add(n);
            }
            return news.stream().limit(10).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    // 5. 최근 본 종목 추가
    @PostMapping("/krx/recent/add")
    public void addRecentStock(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String name = body.get("name");
        if (code != null && name != null) {
            recentStockService.addRecentStock(code, name);
        }
    }

    // 6. 최근 본 종목 조회
    @GetMapping("/krx/recent")
    public List<StockSimpleDTO> getRecentStocks() {
        return recentStockService.getRecentStocks();
    }

    // 7. 실시간 거래대금 랭킹 Top5
    @GetMapping("/krx/ranking/trade")
    public List<RankingDTO> getTradeRanking() {
        return rankingService.getTradeRankingTop5();
    }
}