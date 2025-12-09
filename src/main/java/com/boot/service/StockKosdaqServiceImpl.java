package com.boot.service;

import com.boot.dao.StockKosdaqRepository;
import com.boot.dto.StockKosdaqDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StockKosdaqServiceImpl implements StockKosdaqService {

    private final StockKosdaqRepository repository;

    @Override
    public List<StockKosdaqDTO> findAll() {
        return repository.findAll();
    }

    @Override
    public StockKosdaqDTO findByCode(String code) {
        return repository.findByCode(code);
    }
}
