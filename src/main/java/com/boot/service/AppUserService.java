package com.boot.service;

import java.util.Map;

import com.boot.dto.AppUserDTO;

public interface AppUserService {
	AppUserDTO loginOrRegister(AppUserDTO dto);

	 // 카카오 ID로 사용자 조회
    AppUserDTO findByKakaoId(String kakaoId);
    
    AppUserDTO findByNaverId(String naverId);
    
    AppUserDTO findByGoogleId(String naverId);

    String getAccessToken(String code, String state);
    AppUserDTO getUserInfo(String accessToken);
    
    Map<String, Object> getNaverProfile(String accessToken);
}
