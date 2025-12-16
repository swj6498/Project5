// src/main/java/com/boot/dao/FavoriteStockDao.java
package com.boot.dao;

import com.boot.dto.FavoriteStockDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FavoriteStockDao extends MongoRepository<FavoriteStockDocument, String> {

    // userId 기준으로 최신순 정렬해서 가져오기
    List<FavoriteStockDocument> findByUserIdOrderByCreatedAtDesc(String userId);

    // 중복 체크
    boolean existsByUserIdAndCode(String userId, String code);

    // 삭제
    void deleteByUserIdAndCode(String userId, String code);
}