package com.boot.dto;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;

@Data
@Document(collection = "news_global") // ★ 여기가 핵심: 해외 뉴스 컬렉션 연결
public class StockGlobalNews {

    @Id
    private String id;

    private String title;
    private String link;
    private String content;

    // 파이썬에서 "image_url"로 저장했으므로 매핑 필요
    @Field("image_url")
    // ▼ [2. 추가] 이 줄을 imageUrl 변수 바로 위에 붙이세요
    @JsonProperty("image_url") 
    private String imageUrl;

    // 파이썬에서 "source"로 저장했으므로 매핑
    private String source;

    private String region; // "global"
    private Date pubDate;
}
