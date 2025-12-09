// src/main/java/com/boot/service/RecentStockServiceImpl.java
package com.boot.service;

import com.boot.dto.StockSimpleDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RecentStockServiceImpl implements RecentStockService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String RECENT_KEY = "recent:stocks:user:default";
    private static final int MAX_SIZE = 5;

    @Override
    public void addRecentStock(String code, String name) {
        StockSimpleDTO stock = new StockSimpleDTO();
        stock.setCode(code);
        stock.setName(name);

        redisTemplate.opsForList().leftPush(RECENT_KEY, stock);
        redisTemplate.opsForList().trim(RECENT_KEY, 0, MAX_SIZE - 1);
        redisTemplate.expire(RECENT_KEY, Duration.ofDays(30));
    }

    @Override
    public List<StockSimpleDTO> getRecentStocks() {
        List<Object> list = redisTemplate.opsForList().range(RECENT_KEY, 0, MAX_SIZE - 1);
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }
        return list.stream()
                .map(obj -> (StockSimpleDTO) obj)
                .filter(Objects::nonNull)
                .toList();
    }
}