package com.boot.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.boot.dto.UserAccountDTO;
import com.boot.service.UserAccountService;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api")
public class UserAccountController {

	@Autowired
    private UserAccountService userAccountService;

    // 회원가입 처리
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserAccountDTO userAccountDTO) {
        String result = userAccountService.register(userAccountDTO);
        return ResponseEntity.ok(result);  // 성공 메시지를 반환
    }
    
    @PostMapping("/login")
    public Object login(@RequestBody UserAccountDTO dto, HttpSession session) {

        UserAccountDTO user = userAccountService.login(dto.getUser_id(), dto.getUser_password());

        // 로그인 실패
        if (user == null) {
            return "아이디 또는 비밀번호가 올바르지 않습니다.";
        }

        // 로그인 성공하면 유저 정보 리턴 (비밀번호는 제외)
        user.setUser_password(null);
        
        session.setAttribute("userId", user.getUser_id());  // 세션 저장
        session.setAttribute("userName", user.getNickname());  // 세션 저장
        session.setAttribute("loginType", "LOCAL");
        
        session.setMaxInactiveInterval(60 * 60); // 세션 유지 시간 1시간 설정(초 단위)
        
        return user;
    }
    
    @GetMapping("/info")
    public Map<String, Object> getUserInfo(HttpSession session) {

        String userId = (String) session.getAttribute("userId");
        String loginType = (String) session.getAttribute("loginType");

        if (userId == null) {
            return null;
        }

        UserAccountDTO user = userAccountService.findUserInfo(userId);

        // 프론트에서 사용하는 키(userId / createdAt)에 정확히 맞춰 변환
        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getUser_id());
        result.put("email", user.getEmail());
        result.put("nickname", user.getNickname());
        result.put("profileImage", user.getProfileImage());
        result.put("createdAt", user.getCreatedAt());
        result.put("loginType", loginType);

        return result;
    }
    
    @PostMapping("/modifyUser")
    public int modifyUser(
            @RequestParam("user_id") String userId,
            @RequestParam("email") String email,
            @RequestParam("nickname") String nickname,
            @RequestParam(value = "user_password", required = false) String userPassword,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage
    ) {
        try {
            UserAccountDTO account = new UserAccountDTO();
            account.setUser_id(userId);
            account.setEmail(email);
            account.setNickname(nickname);
            account.setUser_password(userPassword);

            if (profileImage != null && !profileImage.isEmpty()) {
                String savedFileName = userAccountService.saveProfileImage(profileImage);
                account.setProfileImage(savedFileName);
            }

            return userAccountService.updateUserInfo(account); // 성공하면 1 반환
        } catch (Exception e) {
            e.printStackTrace();
            return 0; // 실패
        }
    }


    
    @PostMapping("/deleteUser")
    public int deleteUser(HttpSession session) {

        String userId = (String) session.getAttribute("userId");
        String loginType = (String) session.getAttribute("loginType");

        if (userId == null || loginType == null) {
            System.out.println("❌ 세션 정보 없음 → 실패");
            return 0;
        }

        int result = userAccountService.deleteUser(userId, loginType);

        if (result > 0) session.invalidate();
        return result;
    }

}
