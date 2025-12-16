package com.boot.service;

import com.boot.dto.StockDetailNewsDTO;
import com.boot.dto.StockPriceInfoDTO;

import java.util.List;


public interface StockDetailService {
    List<StockDetailNewsDTO> getNews(String code);
    String getChartUrl(String code, String type, String period);
    StockPriceInfoDTO getPriceInfo(String code);
}