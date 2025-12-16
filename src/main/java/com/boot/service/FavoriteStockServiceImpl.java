package com.boot.service;

import com.boot.dao.FavoriteStockDao;
import com.boot.dto.FavoriteStockDocument;
import com.boot.dto.StockSimpleDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteStockServiceImpl implements FavoriteStockService {

    private final FavoriteStockDao favoriteStockDao;

    @Override
    public List<StockSimpleDTO> getFavorites(String userId) {
        return favoriteStockDao.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(doc -> new StockSimpleDTO(doc.getCode(), doc.getName()))
                .toList();
    }

    @Override
    public void addFavorite(String userId, String code, String name) {
        if (!favoriteStockDao.existsByUserIdAndCode(userId, code)) {
            FavoriteStockDocument doc = FavoriteStockDocument.builder()
                    .userId(userId)
                    .code(code)
                    .name(name)
                    .build();
            favoriteStockDao.save(doc);
        }
    }

    @Override
    public void removeFavorite(String userId, String code) {
        favoriteStockDao.deleteByUserIdAndCode(userId, code);
    }
}