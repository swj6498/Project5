package com.boot.dao;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.boot.dto.SearchLog;

public interface SearchLogRepository extends MongoRepository<SearchLog, String> {

	List<SearchLog> findByTimestampAfter(LocalDateTime time);
}
