package com.boot.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod; // HttpMethod 사용을 위해 임포트 유지
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. JWT 기반 API 서버를 위해 CSRF 비활성화 (POST 요청 허용 목적)
                .csrf(AbstractHttpConfigurer::disable)

                // 2. CORS 비활성화 (Cross-Origin 요청 허용 목적)
                .cors(AbstractHttpConfigurer::disable)

                // 3. HTTP 요청 권한 설정
                .authorizeHttpRequests(auth -> auth

                                // ----------------------------------------------------
                                // 🚨 개발/테스트용 설정: 모든 접근 허용 (All Access Permitted)
                                .anyRequest().permitAll() // ⭐️ 모든 경로, 모든 메서드 접근 허용
                        // ----------------------------------------------------


                        // ----------------------------------------------------
                        // 🛡️ 보안 강화 시 복구할 설정 (주석 처리됨)
                /*
                // 1. 인증 불필요 (Public API) 설정 - 회원가입, 로그인, 공개 데이터
                .requestMatchers("/api/register", "/api/login", "/api/krx/**").permitAll()

                // 2. 특정 경로의 특정 메서드만 차단하고 싶을 때 (예: DELETE 요청 차단)
                // .requestMatchers(HttpMethod.DELETE, "/api/data").denyAll()

                // 3. 나머지 모든 요청은 반드시 인증(JWT 토큰)된 사용자만 접근 허용
                .anyRequest().authenticated()
                */
                        // ----------------------------------------------------
                );

        // JWT 필터 관련 설정은 주석으로 남겨두지 않았습니다. 필요에 따라 추가하세요.
        // 예: http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}