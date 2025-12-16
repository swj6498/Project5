package com.boot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {
	
	@Value("${upload.path}")  // application.properties에 설정한 업로드 경로
    private String uploadPath;

    @Bean
    public WebMvcConfigurer corsConnfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
            
            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                // React에서 http://localhost:8585/uploads/파일명 으로 접근 가능
                registry.addResourceHandler("/uploads/**")
                        .addResourceLocations("file:///" + uploadPath + "/");
            }
            
        };
    }
}
