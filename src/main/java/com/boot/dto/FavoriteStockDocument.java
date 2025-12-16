package com.boot.dto;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "favorite_stocks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FavoriteStockDocument {

    @Id
    private String id;

    private String userId;      // 로그인한 사람 아이디
    private String code;        // 종목코드
    private String name;        // 종목명

    private LocalDateTime createdAt = LocalDateTime.now();
}