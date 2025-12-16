package com.boot.dao;

import com.boot.dto.StockKosdaqDTO;
import org.apache.ibatis.annotations.Param;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StockKosdaqRepository extends MongoRepository<StockKosdaqDTO, Object> {
    StockKosdaqDTO findByCode(@Param("param") String code);
}