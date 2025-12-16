package com.boot.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserAccountDTO {

	private Long user_num;
	private String social_type;
    private String user_id;
    private String user_password;
    private String email;
    private String nickname;
    private String profileImage;
    private String createdAt;
}
