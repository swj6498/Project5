package com.boot.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.boot.dao.StockNewsRepository;
import com.boot.dto.StockNews;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StockNewsService {

    private final StockNewsRepository stockNewsRepository;

    public Page<StockNews> search(String keyword, String category, int page, int size, String sort) {
    	 Sort s = "old".equals(sort)
                 ? Sort.by(Sort.Direction.ASC, "pubDate")
                 : Sort.by(Sort.Direction.DESC, "pubDate");

         Pageable pageable = PageRequest.of(page, size, s);

         // 카테고리만 있을 경우
         if ((keyword == null || keyword.isBlank()) && (category != null && !category.isBlank())) {
             return stockNewsRepository.findByCategory(category, pageable);
         }

         // 카테고리 + 키워드 검색
         if ((keyword != null && !keyword.isBlank()) && (category != null && !category.isBlank())) {
             return stockNewsRepository
                     .findByCategoryAndTitleContainingIgnoreCaseOrCategoryAndContentContainingIgnoreCase(
                             category, keyword, category, keyword, pageable);
         }

        // 4. 아무 조건 없는 경우 전체
        return stockNewsRepository.findAll(pageable);
    }
}
