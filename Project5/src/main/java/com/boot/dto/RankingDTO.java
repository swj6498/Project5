// src/main/java/com/boot/dto/RankingDTO.java
package com.boot.dto;

import lombok.Data;

@Data
public class RankingDTO {

    private int rank;               // 순위 (1, 2, 3...)
    private String code;            // "005930"
    private String name;            // "삼성전자"
    private Long currentPrice;      // 현재가 (예: 108400)
    private Long volume;            // 거래량 (예: 19739076)
    private Long score;             // 거래대금 (억 단위, 예: 2138억)
    private String changeRate;      // 등락률 "+3.14%" (옵션)
    private Long marketCap;         // 시가총액 (억 단위)
}