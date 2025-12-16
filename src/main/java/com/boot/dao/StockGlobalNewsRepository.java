package com.boot.dao;

import com.boot.dto.StockGlobalNews;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StockGlobalNewsRepository
extends MongoRepository<StockGlobalNews, String> {

// 전체 (정렬)
List<StockGlobalNews> findByRegion(
    String region,
    Sort sort
);

// 소스별
List<StockGlobalNews> findByRegionAndSourceIgnoreCase(
    String region,
    String source,
    Sort sort
);

// 검색 (전체)
List<StockGlobalNews> findByRegionAndTitleContainingIgnoreCase(
    String region,
    String keyword,
    Sort sort
);

// 검색 + 소스
List<StockGlobalNews> findByRegionAndSourceIgnoreCaseAndTitleContainingIgnoreCase(
    String region,
    String source,
    String keyword,
    Sort sort
);
}
