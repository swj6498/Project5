package com.boot.service;

import org.springframework.web.multipart.MultipartFile;

import com.boot.dto.UserAccountDTO;

public interface UserAccountService {
	//회원가입
	String register(UserAccountDTO userAccountDTO, MultipartFile file);

	UserAccountDTO login(String userId, String password);
	
	 //소셜 아이디 일반 아이디 모두 조회
    UserAccountDTO findUserInfo(String userId);
    
    //회원정보 수정
    int updateUserInfo(UserAccountDTO account);
    
    //회원 탈퇴
    int deleteUser(String userId, String loginType);
    
    String saveProfileImage(MultipartFile file);
    
    String getLoginType(String userId);
}
