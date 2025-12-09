package com.boot.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.StockNews;
import com.boot.service.StockNewsService;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequiredArgsConstructor
@RequestMapping("/news")
public class StockNewsController {

    private final StockNewsService stockNewsService;
    private final MongoTemplate mongoTemplate;  // ★ 추가 필수

    @GetMapping
    public Page<StockNews> getNews(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sort", defaultValue = "date") String sort
    ) {
        return stockNewsService.search(null, category, page, size, sort);
    }

    @GetMapping("/search")
    public List<StockNews> searchNews(@RequestParam("q") String keyword) {

        Query query = new Query();
        query.addCriteria(
            new Criteria().orOperator(
                Criteria.where("title").regex(keyword, "i"),
                Criteria.where("description").regex(keyword, "i"),
                Criteria.where("author").regex(keyword, "i"),
                Criteria.where("pub_date").regex(keyword, "i")
            )
        );

        List<StockNews> result = mongoTemplate.find(query, StockNews.class);

        System.out.println("검색어 '" + keyword + "' 결과 수: " + result.size());

        return result;
    }
}
