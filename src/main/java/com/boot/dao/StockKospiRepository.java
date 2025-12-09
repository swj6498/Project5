package com.boot.dao;

import com.boot.dto.StockKospiDTO;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface StockKospiRepository extends MongoRepository<StockKospiDTO, Object> {
    StockKospiDTO findByCode(@Param("code") String code);
}