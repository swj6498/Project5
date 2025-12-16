// src/main/java/com/boot/dto/StockKospiDTO.java (수정된 코드)

package com.boot.dto;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant; // java.time.Instant로 통일

// 🚩 [수정] StockCommon 인터페이스를 상속받습니다.
@Data
@Document(collection = "naver_kospi")
public class StockKospiDTO implements StockCommon { // 🚩 StockCommon 상속 추가

    @Id
    private ObjectId _id;             // MongoDB ObjectId

    private String code;              // 종목 코드
    private String crawl_date; // 크롤링 날짜
    private String change;            // 등락
    private String change_rate;       // 등락률
    private Instant crawled_at; // 실제 크롤링 시각 (Instant 유지)
    private Integer current_price;    // 현재가
    private Integer face_value;       // 액면가
    private Double foreign_ratio;     // 외국인 지분율
    private Long listed_shares;       // 상장 주식 수
    private Long market_cap;          // 시가총액
    private String name;              // 종목명
    private Double per;               // PER
    private Integer rank;             // 순위
    private Double roe;               // ROE
    private Long volume;              // 거래량
    private String search;  // 추가 (예: "삼성전자 005930 삼성전자 전자")

}