package com.boot.service;

import com.boot.dto.StockKospiDTO;
import java.util.List;

public interface StockKospiService {
    List<StockKospiDTO> findAll();
    StockKospiDTO findByCode(String code);
}