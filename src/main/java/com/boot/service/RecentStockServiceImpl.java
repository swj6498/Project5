package com.boot.service;

import com.boot.dto.StockSimpleDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper; // Jackson ObjectMapper

    private static final String RECENT_KEY = "recent:stocks:user:default";
    private static final int MAX_SIZE = 5;

    @Override
    public void addRecentStock(String code, String name) {
        StockSimpleDTO stock = new StockSimpleDTO(code, name);
        redisTemplate.opsForList().leftPush(RECENT_KEY, stock);
        redisTemplate.opsForList().trim(RECENT_KEY, 0, MAX_SIZE - 1);
        redisTemplate.expire(RECENT_KEY, Duration.ofDays(30));
    }

    @Override
    public List<StockSimpleDTO> getRecentStocks() {
        List<Object> list = redisTemplate.opsForList().range(RECENT_KEY, 0, MAX_SIZE - 1);
        if (list == null || list.isEmpty()) return new ArrayList<>();

        return list.stream()
                .map(obj -> objectMapper.convertValue(obj, StockSimpleDTO.class))
                .filter(Objects::nonNull)
                .toList();
    }
}
