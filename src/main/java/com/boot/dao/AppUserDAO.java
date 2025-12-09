package com.boot.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.boot.dto.AppUserDTO;

@Mapper
public interface AppUserDAO {
	AppUserDTO findByKakaoId(@Param("kakaoId") String kakaoId);
    void insert(AppUserDTO user);
}
