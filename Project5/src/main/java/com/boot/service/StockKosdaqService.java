package com.boot.service;

import com.boot.dto.StockKosdaqDTO;
import java.util.List;

public interface StockKosdaqService {
    List<StockKosdaqDTO> findAll();
    StockKosdaqDTO findByCode(String code);
}