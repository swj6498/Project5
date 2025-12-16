// src/main/java/com/boot/service/impl/StockCacheServiceImpl.java
package com.boot.service;

import com.boot.dao.StockKospiRepository;
import com.boot.dao.StockKosdaqRepository;
import com.boot.dto.StockCommon; // 🚩 [추가] 공통 인터페이스 임포트
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StockCacheServiceImpl implements StockCacheService {

    private final StockKospiRepository kospiRepository;
    private final StockKosdaqRepository kosdaqRepository;

    // 표준 ISO 형식으로 Instant → String 변환 (Z 포함, 밀리초 3자리)
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    // 한국 날짜만 추출용 (예: "2025-12-15")
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    .withZone(ZoneId.of("Asia/Seoul"));

    // 🚩 [수정] StockCommon 인터페이스를 인수로 받도록 변경
    private Map<String, Object> stockToMap(StockCommon dto) {
        Map<String, Object> map = new HashMap<>();

        // 🚩 [수정] 캐스팅 없이 StockCommon 인터페이스의 Getter 호출
        map.put("code", dto.getCode());
        map.put("name", dto.getName());
        map.put("current_price", dto.getCurrent_price());
        map.put("change", dto.getChange());
        map.put("change_rate", dto.getChange_rate());
        map.put("volume", dto.getVolume());
        map.put("market_cap", dto.getMarket_cap());
        map.put("foreign_ratio", dto.getForeign_ratio());
        map.put("per", dto.getPer());
        map.put("roe", dto.getRoe());

        // crawled_at 처리 개선
        Instant crawledAt = dto.getCrawled_at();
        if (crawledAt != null) {
            map.put("crawled_at", ISO_FORMATTER.format(crawledAt));  // "2025-12-15T09:30:55.620Z"
            map.put("crawl_date", DATE_FORMATTER.format(crawledAt)); // "2025-12-15" (한국 기준)
        } else {
            map.put("crawled_at", null);
            map.put("crawl_date", null);
        }

        return map;
    }

    @Override
    @Cacheable(value = "kospi_list")
    public List<Map<String, Object>> getKospiList() {
        // kospiRepository.findAll()은 List<StockKospiDTO>를 반환하며, 이는 StockCommon 리스트입니다.
        return kospiRepository.findAll().stream()
                .map(this::stockToMap)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "kosdaq_list")
    public List<Map<String, Object>> getKosdaqList() {
        // kosdaqRepository.findAll()은 List<StockKosdaqDTO>를 반환하며, 이는 StockCommon 리스트입니다.
        return kosdaqRepository.findAll().stream()
                .map(this::stockToMap)
                .collect(Collectors.toList());
    }
}