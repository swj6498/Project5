package com.boot.dto;

import lombok.Data;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.annotation.Id;

import java.util.Date;

@Data
@Document(collection = "search_log")
public class SearchLog {

    @Id
    private String id;

    private String keyword;

    private Date timestamp;  
}
