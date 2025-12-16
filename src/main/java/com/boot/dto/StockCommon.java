// src/main/java/com/boot/dto/StockCommon.java

package com.boot.dto;

import java.time.Instant; // 🚩 Instant로 통일

public interface StockCommon {

    // 필수 공통 필드
    String getCode();
    String getName();
    Instant getCrawled_at(); // Instant 타입으로 통일

    // 시세 및 재무 공통 필드
    Integer getCurrent_price();
    String getChange();
    String getChange_rate();
    Long getVolume();
    Long getMarket_cap();
    Double getForeign_ratio();
    Double getPer();
    Double getRoe();

    String getCrawl_date();
}