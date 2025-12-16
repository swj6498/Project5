package com.boot.dao;

import java.util.ArrayList;
import java.util.HashMap;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.boot.dto.UserAccountDTO;


@Mapper
public interface UserAccountDAO {
	// 아이디로 사용자 조회
    UserAccountDTO findByUserId(String userId);

    // 이메일로 사용자 조회
    UserAccountDTO findByEmail(String email);
    
    //회원가입
    int insertUserAccount(UserAccountDTO userAccountDTO);
    
    //로그인
    public ArrayList<UserAccountDTO> loginYn(HashMap<String, String>param);
    
    //소셜 아이디 일반 아이디 모두 조회
    UserAccountDTO findUserInfo(String userId);
    
    //회원정보 수정
    int updateUserInfo(UserAccountDTO account);
    
    //회원탈퇴
    int deleteUser(@Param("userId") String userId, @Param("loginType") String loginType);
    
    String getLoginType(String userId);
}
