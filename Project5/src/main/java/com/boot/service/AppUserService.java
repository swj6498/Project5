package com.boot.service;

import com.boot.dto.AppUserDTO;

public interface AppUserService {
	AppUserDTO loginOrRegister(AppUserDTO dto);

	 // 카카오 ID로 사용자 조회
    AppUserDTO findByKakaoId(String kakaoId);
    
}
