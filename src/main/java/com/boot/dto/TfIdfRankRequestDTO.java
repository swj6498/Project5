package com.boot.dto;

import java.util.List;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.Data;

@Data
@Document(collection = "news") // MongoDB 컬렉션 이름
public class TfIdfRankRequestDTO {
	 private String query;
	 private List<Map<String, Object>> documents;
}
