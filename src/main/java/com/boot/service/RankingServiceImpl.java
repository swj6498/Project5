// src/main/java/com/boot/service/RankingServiceImpl.java
package com.boot.service;

import com.boot.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RankingServiceImpl implements RankingService {

    private final StockKospiService kospiService;
    private final StockKosdaqService kosdaqService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String RANKING_KEY = "ranking:trade_amount";

    // 실시간 거래대금 랭킹 Top 5
    @Override
    public List<RankingDTO> getTradeRankingTop5() {
        ZSetOperations<String, String> zSet = redisTemplate.opsForZSet();
        Set<ZSetOperations.TypedTuple<String>> tuples = zSet.reverseRangeWithScores(RANKING_KEY, 0, 4);

        List<RankingDTO> result = new ArrayList<>();
        int rank = 1;

        if (tuples != null) {
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
                dto.setScore(score != null ? Math.round(score / 100000000) : 0); // 억 단위
                result.add(dto);
            }
        }
        return result;
    }

    // 15초마다 랭킹 갱신
    @Scheduled(fixedRate = 15000)
    @Override
    public void updateTradeRanking() {
        List<Object> all = new ArrayList<>();
        all.addAll(kospiService.findAll());
        all.addAll(kosdaqService.findAll());

        ZSetOperations<String, String> zSet = redisTemplate.opsForZSet();
        zSet.removeRange(RANKING_KEY, 0, -1);

        all.forEach(stock -> {
            Integer price = getInteger(stock, "current_price");
            Long volume = getLong(stock, "volume");
            String code = getString(stock, "code");

            if (price != null && volume != null && code != null) {
                double score = (long) price * volume;
                zSet.add(RANKING_KEY, code, score);
            }
        });
    }

    // 리플렉션 헬퍼
    private String getString(Object obj, String field) {
        try {
            var f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            return (String) f.get(obj);
        } catch (Exception e) { return null; }
    }

    private Integer getInteger(Object obj, String field) {
        try {
            var f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            Object val = f.get(obj);
            return val instanceof Integer i ? i : null;
        } catch (Exception e) { return null; }
    }

    private Long getLong(Object obj, String field) {
        try {
            var f = obj.getClass().getDeclaredField(field);
            f.setAccessible(true);
            Object val = f.get(obj);
            if (val instanceof Integer i) return i.longValue();
            if (val instanceof Long l) return l;
            return null;
        } catch (Exception e) { return null; }
    }
}