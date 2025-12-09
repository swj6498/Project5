package com.boot.service;

import org.springframework.stereotype.Service;  

import com.boot.dao.AppUserDAO;
import com.boot.dto.AppUserDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppUserServiceImpl implements AppUserService{
	
	private final AppUserDAO dao;

	@Override
    public AppUserDTO loginOrRegister(AppUserDTO dto) {
		
        AppUserDTO user = getUserByAnyId(dto);

        // 사용자가 없다면 새 사용자 등록
        if (user == null) {
            dao.insert(dto);
            // 새 사용자 등록 후 바로 반환
            return dto;
        }

        return user;
    }

    private AppUserDTO getUserByAnyId(AppUserDTO dto) {
        if (dto.getKakaoId() != null) {
            return dao.findByKakaoId(dto.getKakaoId());
        }
        return null;
    }

    @Override
    public AppUserDTO findByKakaoId(String kakaoId) {
        return dao.findByKakaoId(kakaoId);
    }

}
