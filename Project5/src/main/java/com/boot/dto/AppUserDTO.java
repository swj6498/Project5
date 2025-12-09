package com.boot.dto;

import java.util.Date;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppUserDTO {
	private Long userId;
    private String kakaoId;
    private String email;
    private String nickname;
    private String profileImage;
    private Date createdAt;

}
