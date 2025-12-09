// src/main/java/com/boot/service/RankingService.java
package com.boot.service;

import com.boot.dto.RankingDTO;
import java.util.List;

public interface RankingService {
    List<RankingDTO> getTradeRankingTop5();
    void updateTradeRanking(); // 스케줄러용
}