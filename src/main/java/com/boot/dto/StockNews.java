package com.boot.dto;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Getter;
import lombok.Setter;

@Document(collection = "news_crawling")
@Getter
@Setter
public class StockNews {
    @Id
    private String id;          // MongoDB 기본 ID

    private String title;       // 뉴스 제목
    private String link;        // 뉴스 링크
    private String author;      // 기자 이름
    private String content;     // 뉴스 본문
    private String media;       // 언론사 이름
    private String mediaLogo;   // 언론사 로고 URL
    private String image_url;   // 기사 이미지 URL
    private String pubDate;     // 작성일
    private String category;    // 세부 카테고리 (금융, 증권 등)
}
