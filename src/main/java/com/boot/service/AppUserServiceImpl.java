package com.boot.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.boot.dao.AppUserDAO;
import com.boot.dto.AppUserDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppUserServiceImpl implements AppUserService {

    private final AppUserDAO dao;

    @Value("${naver.client-id}")
    private String clientId;

    @Value("${naver.client-secret}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();


    // 로그인 or 자동 회원가입
    @Override
    public AppUserDTO loginOrRegister(AppUserDTO dto) {

        AppUserDTO user = getUserByAnyId(dto);

        // 신규 가입이면 insert
        if (user == null) {
            dao.insert(dto);

            // 방금 insert한 사용자 다시 조회해야 userId 포함됨
            if (dto.getKakaoId() != null) {
                return dao.findByKakaoId(dto.getKakaoId());
            }
            if (dto.getNaverId() != null) {
                return dao.findByNaverId(dto.getNaverId());
            }
            if (dto.getGoogleId() != null) {
            	return dao.findByGoogleId(dto.getGoogleId());
            }
        }

        return user;
    }


    // 소셜 ID로 사용자 조회
    private AppUserDTO getUserByAnyId(AppUserDTO dto) {

        if (dto.getKakaoId() != null) {
            return dao.findByKakaoId(dto.getKakaoId());
        }

        if (dto.getNaverId() != null) {
            return dao.findByNaverId(dto.getNaverId());
        }
        
        if (dto.getGoogleId() != null) {
        	return dao.findByGoogleId(dto.getGoogleId());
        }

        return null;
    }

    @Override
    public AppUserDTO findByKakaoId(String kakaoId) {
        return dao.findByKakaoId(kakaoId);
    }

    @Override
    public AppUserDTO findByNaverId(String naverId) {
        return dao.findByNaverId(naverId);
    }
    
    @Override
    public AppUserDTO findByGoogleId(String googleId) {
    	return dao.findByGoogleId(googleId);
    }


    // 네이버 Access Token 받기
    @Override
    public String getAccessToken(String code, String state) {
    	String url = "https://nid.naver.com/oauth2.0/token";

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("code", code);
        params.add("state", state);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, new HttpHeaders());

        ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

        return response.getBody().get("access_token").toString();
    }


    // 네이버 사용자 정보 가져오기
    @Override
    public AppUserDTO getUserInfo(String accessToken) {

        String url = "https://openapi.naver.com/v1/nid/me";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> resp =
                restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

        if (!resp.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("네이버 프로필 요청 실패: " + resp.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(resp.getBody());
            JsonNode res = root.path("response");

            AppUserDTO dto = new AppUserDTO();
            dto.setNaverId(res.path("id").asText());
            dto.setEmail(res.path("email").asText(null));
            dto.setNickname(res.path("nickname").asText(null));
            dto.setProfileImage(res.path("profile_image").asText(null));
            dto.setSocialType("NAVER");

            return dto;

        } catch (Exception e) {
            throw new RuntimeException("네이버 프로필 파싱 실패", e);
        }
    }
    
    @Override
    public Map<String, Object> getNaverProfile(String accessToken) {
    	String url = "https://openapi.naver.com/v1/nid/me";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> response =
                restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("네이버 프로필 조회 실패");
        }

        return (Map<String, Object>) response.getBody().get("response");
    }
}
