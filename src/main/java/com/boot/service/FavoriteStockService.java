package com.boot.service;

import com.boot.dto.StockSimpleDTO;
import java.util.List;

public interface FavoriteStockService {
    List<StockSimpleDTO> getFavorites(String userId);
    void addFavorite(String userId, String code, String name);
    void removeFavorite(String userId, String code);
}