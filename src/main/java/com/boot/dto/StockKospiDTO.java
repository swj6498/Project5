package com.boot.dto;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Document(collection = "naver_kospi")
public class StockKospiDTO {

    @Id
    private ObjectId _id;             // MongoDB ObjectId

    private String code;              // 종목 코드
    private String crawl_date; // 크롤링 날짜
    private String change;            // 등락
    private String change_rate;       // 등락률
    private LocalDateTime crawled_at; // 실제 크롤링 시각
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
}
