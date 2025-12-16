package com.boot.service;

import com.boot.dto.RankingDTO;
import java.util.List;

public interface RankingService {

    List<RankingDTO> getTopByTradeAmount();    // 거래대금
    List<RankingDTO> getTopByVolume();         // 거래량
    List<RankingDTO> getTopByChangeRate();     // 등락률
    List<RankingDTO> getTopByMarketCap();      // 시가총액
    List<RankingDTO> getTopByMixedScore();     // 혼합 점수
}