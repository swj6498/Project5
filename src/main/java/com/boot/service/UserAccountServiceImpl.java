package com.boot.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.boot.dao.UserAccountDAO;
import com.boot.dto.UserAccountDTO;

@Service
public class UserAccountServiceImpl implements UserAccountService{

    @Autowired
    private UserAccountDAO dao;
    
    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
	
	@Override
	public String register(UserAccountDTO userAccountDTO) {
		 // 아이디나 이메일 중복 체크
        if (dao.findByUserId(userAccountDTO.getUser_id()) != null) {
            return "이미 사용 중인 아이디입니다.";
        }

        if (dao.findByEmail(userAccountDTO.getEmail()) != null) {
            return "이미 사용 중인 이메일입니다.";
        }
        
        String encodedPassword = passwordEncoder.encode(userAccountDTO.getUser_password());
        userAccountDTO.setUser_password(encodedPassword);
        
        dao.insertUserAccount(userAccountDTO);  // XML 쿼리로 저장
        return "회원가입이 성공적으로 완료되었습니다.";
    }

	@Override
    public UserAccountDTO login(String userId, String rawPassword) {

        // 아이디로 사용자 조회
        UserAccountDTO user = dao.findByUserId(userId);

        if (user == null) {
            return null;   // 아이디 없음
        }

        // 비밀번호 매칭
        if (!passwordEncoder.matches(rawPassword, user.getUser_password())) {
            return null;   // 비밀번호 틀림
        }

        // 로그인 성공
        return user;
    }

	@Override
	public UserAccountDTO findUserInfo(String userId) {
		return dao.findUserInfo(userId);
	}

	@Override
	public int updateUserInfo(UserAccountDTO account) {
		
		if (account.getUser_password() != null && !account.getUser_password().isEmpty()) {
	        // 암호화
	        String encoded = passwordEncoder.encode(account.getUser_password());
	        account.setUser_password(encoded);
	    } else {
	        // 비밀번호 입력 안 했으면 null 처리 → XML에서 비밀번호 제외 업데이트
	        account.setUser_password(null);
	    }

	    return dao.updateUserInfo(account);
	}

	@Override
	public int deleteUser(String userId, String loginType) {
		return dao.deleteUser(userId, loginType);
	}
	
	@Value("${upload.path}")
    private String uploadPath;

	
	@Override
	public String saveProfileImage(MultipartFile file) {
	    if (file == null || file.isEmpty()) return null;

	    try {
	        // 원본 파일명 안전하게 가져오기
	        String originalFileName = Paths.get(file.getOriginalFilename()).getFileName().toString();
	        String fileName = UUID.randomUUID() + "_" + originalFileName;

	        Path uploadDir = Paths.get(uploadPath);
	        if (!Files.exists(uploadDir)) {
	            Files.createDirectories(uploadDir); // 폴더 없으면 생성
	        }

	        Path filePath = uploadDir.resolve(fileName);
	        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

	        return fileName;
	    } catch (IOException e) {
	        // Logger 사용 추천
	        e.printStackTrace();
	        return null;
	    }
	}
}
