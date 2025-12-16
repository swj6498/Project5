package com.boot.controller;

import java.util.HashMap;  
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping; 
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.boot.dto.AppUserDTO;
import com.boot.service.AppUserService;
import com.boot.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AppUserController {

	@Autowired
    private AppUserService userService;
	
	@Autowired
	private JwtUtil jwtUtil;

	
    // 회원 가입 및 로그인 처리
	@PostMapping("/loginOrRegister")
	public ResponseEntity<?> loginOrRegister(@RequestBody AppUserDTO dto) {

	    String socialType = dto.getSocialType();

	    // ======== 1) socialType 자동 감지 ========
	    if (socialType == null) {
	        if (dto.getKakaoId() != null) {
	            socialType = "KAKAO";
	            dto.setSocialType("KAKAO");

	        } else if (dto.getNaverId() != null) {
	            socialType = "NAVER";
	            dto.setSocialType("NAVER");

	        } else if (dto.getGoogleId() != null) {   // ★ GOOGLE 추가
	            socialType = "GOOGLE";
	            dto.setSocialType("GOOGLE");

	        } else {
	            return ResponseEntity.status(400).body("socialType not provided");
	        }
	    }

	    // ======== 2) DB 조회 또는 자동가입 ========
	    AppUserDTO user = userService.loginOrRegister(dto);

	    if (user == null) {
	        return ResponseEntity.status(401).body("Login failed.");
	    }

	    // ======== 3) JWT 생성 (소셜별 ID 자동 매핑) ========
	    String token = null;

	    switch (socialType) {
	        case "KAKAO":
	            token = jwtUtil.createToken(user.getKakaoId(), "KAKAO");
	            break;

	        case "NAVER":
	            token = jwtUtil.createToken(user.getNaverId(), "NAVER");
	            break;

	        case "GOOGLE":     // ★ GOOGLE 추가
	            token = jwtUtil.createToken(user.getGoogleId(), "GOOGLE");
	            break;

	        default:
	            return ResponseEntity.status(400).body("Invalid socialType");
	    }

	    // ======== 4) 응답 구성 ========
	    Map<String, Object> response = new HashMap<>();
	    response.put("user", user);
	    response.put("token", token);

	    return ResponseEntity.ok(response);
	}

	
	@PostMapping("/naver/callback")
	public ResponseEntity<?> naverCallback(@RequestBody Map<String, String> body) {

	    String accessToken = body.get("access_token");

	    if (accessToken == null) {
	        return ResponseEntity.badRequest().body("access_token is missing");
	    }

	    // 1) 네이버 프로필 조회
	    Map<String, Object> profile = userService.getNaverProfile(accessToken);

	    String naverId = profile.get("id").toString();
	    String email = (String) profile.get("email");
	    String nickname = (String) profile.get("nickname");
	    String profileImage = (String) profile.get("profile_image");

	    // 2) DTO 생성 (DB 처리용)
	    AppUserDTO dto = new AppUserDTO();
	    dto.setNaverId(naverId);
	    dto.setEmail(email);
	    dto.setNickname(nickname);
	    dto.setProfileImage(profileImage);
	    dto.setSocialType("NAVER");

	    // 3) DB 사용자 조회/자동가입
	    AppUserDTO user = userService.loginOrRegister(dto);

	    if (user == null) {
	        return ResponseEntity.status(401).body("Login failed.");
	    }

	    // 4) JWT 생성
	    String token = jwtUtil.createToken(user.getNaverId(), "NAVER");

	    Map<String, Object> response = new HashMap<>();
	    response.put("user", user);
	    response.put("token", token);

	    return ResponseEntity.ok(response);
	}
	
	@PostMapping("/google")
	public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> req) {

	    String idToken = req.get("idToken");
	    if (idToken == null) {
	        return ResponseEntity.badRequest().body("idToken is missing");
	    }

	    try {
	        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

	        RestTemplate restTemplate = new RestTemplate();
	        Map<String, Object> googleData = restTemplate.getForObject(url, Map.class);

	        if (googleData == null || googleData.get("sub") == null) {
	            return ResponseEntity.status(401).body("Invalid Google ID Token");
	        }

	        // 🔥 client_id 검증 추가 (보안 필수)
	        String clientId = "925554401773-fojodmg8ktecqu8g8usn87ifkh78fafc.apps.googleusercontent.com";
	        String aud = (String) googleData.get("aud");

	        if (aud == null || !aud.equals(clientId)) {
	            return ResponseEntity.status(401).body("Invalid client_id");
	        }

	        // Google Returns:
	        String googleId = googleData.get("sub").toString();
	        String email = (String) googleData.get("email");
	        String name = (String) googleData.get("name");
	        String picture = (String) googleData.get("picture");

	        // DTO 구성
	        AppUserDTO dto = new AppUserDTO();
	        dto.setGoogleId(googleId);
	        dto.setEmail(email);
	        dto.setNickname(name);
	        dto.setProfileImage(picture);
	        dto.setSocialType("GOOGLE");

	        // DB 조회 or 자동가입
	        AppUserDTO user = userService.loginOrRegister(dto);

	        // JWT 발급
	        String token = jwtUtil.createToken(googleId, "GOOGLE");

	        Map<String, Object> result = new HashMap<>();
	        result.put("user", user);
	        result.put("token", token);

	        return ResponseEntity.ok(result);

	    } catch (Exception e) {
	        return ResponseEntity.status(500).body("Google Login Error: " + e.getMessage());
	    }
	}

	
    //로그아웃
    @PostMapping("/logout")
    public Map<String, Object> logout() {
        Map<String, Object> result = new HashMap<>();

        result.put("message", "로그아웃 되었습니다.");
        return result;
    }
}