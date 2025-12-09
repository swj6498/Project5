    package com.boot.dao;

    import com.boot.dto.StockKosdaqDTO;
    import org.apache.ibatis.annotations.Param;
    import org.springframework.data.mongodb.repository.MongoRepository;

    public interface StockKosdaqRepository extends MongoRepository<StockKosdaqDTO, Object> {
        StockKosdaqDTO findByCode(@Param("code") String code);
    }