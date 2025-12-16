package com.boot.dto;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "news_terms")
public class NewsTerm {

    @Id
    private String id;
    private String term;  // 검색어 저장

    // getter 메서드 추가
    public String getTerm() {
        return term;
    }

    // setter 메서드 (필요하면 추가)
    public void setTerm(String term) {
        this.term = term;
    }
}