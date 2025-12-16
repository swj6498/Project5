package com.boot.dto;

import lombok.Data;

@Data
public class StockPriceInfoDTO {
    private Long prevClose;      // 전일 종가
    private Long openPrice;      // 시가
    private Long highPrice;      // 고가
    private Long lowPrice;       // 저가
    private Long upperLimit;     // 상한가
    private Long lowerLimit;     // 하한가
    private Long tradeAmount;    // 거래대금 (원 단위)
}