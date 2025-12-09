package com.boot.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.boot.dto.StockNews;

public interface StockNewsRepository extends MongoRepository<StockNews, String> {

    // 카테고리만 필터링 (keyword 없는 경우)
    Page<StockNews> findByCategory(String category, Pageable pageable);

    // 카테고리 + 키워드 검색 (title 또는 content 포함)
    Page<StockNews> findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCase(
            String category1, String titleKeyword,
            String category2, String contentKeyword,
            Pageable pageable
    );
}
