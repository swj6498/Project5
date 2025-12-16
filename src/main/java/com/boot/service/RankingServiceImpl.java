package com.boot.service;

import com.boot.dto.RankingDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String TRADE_KEY = "ranking:trade_amount";
    private static final String VOLUME_KEY = "ranking:volume";
    private static final String CHANGE_KEY = "ranking:change_rate";
    private static final String MARKET_KEY = "ranking:market_cap";
    private static final String MIXED_KEY = "ranking:mixed_score";

    // -------------------- 조회 API --------------------
    @Override
    public List<RankingDTO> getTopByTradeAmount() { return getTopFromZSet(TRADE_KEY); }

    @Override
    public List<RankingDTO> getTopByVolume() { return getTopFromZSet(VOLUME_KEY); }

    @Override
    public List<RankingDTO> getTopByChangeRate() { return getTopFromZSet(CHANGE_KEY); }

    @Override
    public List<RankingDTO> getTopByMarketCap() { return getTopFromZSet(MARKET_KEY); }

    @Override
    public List<RankingDTO> getTopByMixedScore() { return getTopFromZSet(MIXED_KEY); }

    private List<RankingDTO> getTopFromZSet(String key) {
        ZSetOperations<String, String> zSet = redisTemplate.opsForZSet();
        Set<ZSetOperations.TypedTuple<String>> tuples = zSet.reverseRangeWithScores(key, 0, 9);

        if (tuples == null) return new ArrayList<>();
        int rank = 1;
        List<RankingDTO> result = new ArrayList<>();

        for (var tuple : tuples) {
            String code = tuple.getValue();
            Double score = tuple.getScore();

            Object stock = kospiService.findByCode(code);
            if (stock == null) stock = kosdaqService.findByCode(code);
            if (stock == null) continue;

            RankingDTO dto = new RankingDTO();
            dto.setRank(rank++);
            dto.setCode(code);
            dto.setName(getString(stock, "name"));
            dto.setCurrentPrice(getLong(stock, "current_price"));
            dto.setVolume(getLong(stock, "volume"));
            dto.setChangeRate(getString(stock, "change_rate"));
            dto.setMarketCap(getLong(stock, "market_cap"));

            // key에 따라 score / mixedScore 구분
            if (MIXED_KEY.equals(key)) {
                dto.setMixedScore(score != null ? Math.round(score) : 0);
                dto.setScore(null);
            } else {
                dto.setScore(score != null ? Math.round(score) : 0);
                dto.setMixedScore(null);
            }

            result.add(dto);
        }
        return result;
    }

    // -------------------- 60초마다 갱신 --------------------
    @Scheduled(fixedRate = 60000)
    public void updateRanking() {
        List<Object> all = new ArrayList<>();
        all.addAll(kospiService.findAll());
        all.addAll(kosdaqService.findAll());

        // 기존 ZSet 초기화
        Arrays.asList(TRADE_KEY, VOLUME_KEY, CHANGE_KEY, MARKET_KEY, MIXED_KEY)
                .forEach(k -> redisTemplate.opsForZSet().removeRange(k, 0, -1));

        all.forEach(stock -> {
            String code = getString(stock, "code");
            Integer price = getInteger(stock, "current_price");
            Long volume = getLong(stock, "volume");
            String changeStr = getString(stock, "change_rate");
            Long marketCap = getLong(stock, "market_cap");

            if (code == null) return;

            double tradeScore = safe(price) * safe(volume);         // 거래대금
            double volumeScore = safe(volume);                       // 거래량
            double changeScore = parseChangeRate(changeStr);        // 등락률
            double marketScore = safe(marketCap);                   // 시가총액
            double mixedScore = 0.4 * tradeScore + 0.3 * volumeScore + 0.2 * changeScore + 0.1 * marketScore;

            ZSetOperations<String, String> zSet = redisTemplate.opsForZSet();
            zSet.add(TRADE_KEY, code, tradeScore);
            zSet.add(VOLUME_KEY, code, volumeScore);
            zSet.add(CHANGE_KEY, code, changeScore);
            zSet.add(MARKET_KEY, code, marketScore);
            zSet.add(MIXED_KEY, code, mixedScore);
        });
    }

    // -------------------- 헬퍼 --------------------
    private double safe(Number n) { return n != null ? n.doubleValue() : 0; }

    private double parseChangeRate(String rate) {
        if (rate == null || rate.isEmpty()) return 0;
        return Double.parseDouble(rate.replace("%", "").replace("+", "").replace("-", ""));
    }

    private String getString(Object obj, String field) {
        try { var f = obj.getClass().getDeclaredField(field); f.setAccessible(true); return (String) f.get(obj); }
        catch (Exception e) { return null; }
    }

    private Integer getInteger(Object obj, String field) {
        try { var f = obj.getClass().getDeclaredField(field); f.setAccessible(true); Object val = f.get(obj); return val instanceof Integer i ? i : null; }
        catch (Exception e) { return null; }
    }

    private Long getLong(Object obj, String field) {
        try { var f = obj.getClass().getDeclaredField(field); f.setAccessible(true); Object val = f.get(obj);
            if (val instanceof Integer i) return i.longValue();
            if (val instanceof Long l) return l;
            return null;
        } catch (Exception e) { return null; }
    }
}
