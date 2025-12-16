package com.boot.service;

import java.util.List;
import java.util.Map;

public interface StockCacheService {
    // 프론트가 쓰는 그대로 유지 (호환성 완벽)
    List<Map<String, Object>> getKospiList();
    List<Map<String, Object>> getKosdaqList();
}