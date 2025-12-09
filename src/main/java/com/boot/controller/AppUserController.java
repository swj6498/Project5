package com.boot.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.boot.dto.AppUserDTO;
import com.boot.service.AppUserService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
public class AppUserController {

	@Autowired
    private AppUserService userService;
	
    // 회원 가입 및 로그인 처리
    @PostMapping("/loginOrRegister")
    public AppUserDTO loginOrRegister(@RequestBody AppUserDTO dto, HttpSession session) {
  
    	AppUserDTO user = userService.loginOrRegister(dto);
    	
    	if (user != null) {
    		session.setAttribute("userId", user.getKakaoId());  // 세션 저장
            session.setAttribute("userName", user.getNickname());  // 세션 저장
            session.setAttribute("loginType", "KAKAO");
            
            session.setMaxInactiveInterval(60 * 60); // 세션 유지 시간 1시간 설정(초 단위)
        }

        return user;
    }
    
    //세션 정보 읽기
    @GetMapping("/session/user")
    public Map<String, Object> getSessionUser(HttpSession session) {
        Map<String, Object> result = new HashMap<>();

        Object userId = session.getAttribute("userId");
        Object nickname = session.getAttribute("userName");
        Object loginType = session.getAttribute("loginType");
        
        result.put("loggedIn", userId != null);  
        result.put("userId", userId);
        result.put("nickname", nickname);
        result.put("loginType", loginType);

        return result;
    }
    
    //로그아웃
    @PostMapping("/logout")
    public Map<String, Object> logout(HttpSession session) {
        Map<String, Object> result = new HashMap<>();

        session.invalidate(); // 모든 세션 삭제

        result.put("message", "로그아웃 되었습니다.");
        return result;
    }
}