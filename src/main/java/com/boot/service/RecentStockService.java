// src/main/java/com/boot/service/RecentStockService.java
package com.boot.service;

import com.boot.dto.StockSimpleDTO;
import java.util.List;

public interface RecentStockService {
    void addRecentStock(String code, String name);
    List<StockSimpleDTO> getRecentStocks();
}