import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './Register.css';
import { useTranslation } from "react-i18next";

const SignUpForm = () => {
	
	const { t } = useTranslation();
	
	const navigate = useNavigate();
	
    const [userId, setUserId] = useState("");
    const [userPassword, setUserPassword] = useState("");
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [message, setMessage] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [userIdError, setUserIdError] = useState("");

    // 비밀번호 유효성 검사 (8자 이상, 숫자, 대소문자, 특수문자 포함)
    const passwordValidation = (password) => {
        const regex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    // 이메일 유효성 검사
    const emailValidation = (email) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return regex.test(email);
    };

    // 폼 제출 처리
	const handleSubmit = async (event) => {
	    event.preventDefault();

	    setEmailError("");
	    setPasswordError("");
	    setUserIdError("");
	    setMessage("");

	    const validationErrors = [];

	    if (userPassword && !passwordValidation(userPassword)) {
	        setPasswordError(t("errorPassword"));
	        validationErrors.push("비밀번호 유효성 검사 실패");
	    }
	    if (email && !emailValidation(email)) {
	        setEmailError(t("errorEmail"));
	        validationErrors.push("이메일 유효성 검사 실패");
	    }
	    if (userId.trim() === "") {
	        validationErrors.push(t("errorUserId"));
	    }
	    if (validationErrors.length > 0) return;

	    // ------------------------------------
	    // 🔥 FormData 생성
	    // ------------------------------------
	    const formData = new FormData();

	    // JSON 데이터를 Blob으로 감싸 넣기
	    const userJson = {
	        user_id: userId,
	        user_password: userPassword,
	        email: email,
	        nickname: nickname,
	    };

	    formData.append(
	        "user",
	        new Blob([JSON.stringify(userJson)], { type: "application/json" })
	    );

	    // 파일 추가
	    if (profileImage) {
	        formData.append("profileImage", profileImage);
	    }

		try {
		    const response = await axios.post("/api/register", formData, {
		        headers: { "Content-Type": "multipart/form-data" }
		    });

		    const msg = response.data; // 백엔드에서 넘어온 key

		    if (msg === "error.userIdExists") {
		        setUserIdError(t("duplicateId"));
		        return;
		    }
		    if (msg === "error.emailExists") {
		        setEmailError(t("duplicateEmail"));
		        return;
		    }

		    alert(t("registerSuccess"));
		    navigate("/");

		} 		catch (error) {

		    if (error.response) {
		        // 서버가 400, 500 응답을 보낸 경우
		        console.error("서버 응답 오류:", error.response.data);
		    } else if (error.request) {
		        // 요청은 갔지만 응답이 없는 경우
		        console.error("응답 없음:", error.request);
		    } else {
		        // 요청 만들기도 전에 오류
		        console.error("요청 오류:", error.message);
		    }

		    setMessage(t("registerFail"));
			}
	};


    return (
        <div className="regiter-wrapper">
		
			<div className="site-title-register">
		        <h1>Stock & News Search</h1>
		    </div>
		
			<div className="register-container">
	            <h2 className="register-title">{t("register")}</h2>
	            <form onSubmit={handleSubmit}>
	                <div>
	                    <p className="register-p">{t("id")}&nbsp;&nbsp;&nbsp;&nbsp;
						{userIdError && <label style={{ color: "#FF0000" }}>{userIdError}</label>}  {/* 아이디 중복 오류 메시지 */}</p>
	                    <input
	                        type="text"
	                        value={userId}
	                        onChange={(e) => setUserId(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">{t("pw")}&nbsp;&nbsp;&nbsp;&nbsp;
						{passwordError && <label style={{ color: "#FF0000" }}>{passwordError}</label>}</p>
	                    <input
	                        type="password"
	                        value={userPassword}
	                        onChange={(e) => setUserPassword(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">{t("email")}&nbsp;&nbsp;&nbsp;&nbsp;
						{emailError && <label style={{ color: "#FF0000" }}>{emailError}</label>}</p>
	                    <input
	                        type="email"
	                        value={email}
	                        onChange={(e) => setEmail(e.target.value)}
	                        required
							className="register-input"
	                    />
	                </div>
	                <div>
	                    <p className="register-p">{t("nickname")}</p>
	                    <input
	                        type="text"
	                        value={nickname}
	                        onChange={(e) => setNickname(e.target.value)}
							className="register-input"
	                    />
	                </div>
					<div>
					    <p className="register-p">{t("profileImg")}</p>
					    <div className="custom-file-upload">
					        <input
					            type="file"
					            id="file-input"
					            onChange={(e) => setProfileImage(e.target.files[0])}  // 선택된 파일을 상태에 저장
					            className="register-input-file"
					        />
					        <label htmlFor="file-input" className="custom-file-label">
					            {t("select")}
					        </label>
					        <span className="file-name">
					            {profileImage ? profileImage.name : t("noFile")}
					        </span>
					    </div>
					</div>
	                <button type="submit" className="register-btn">{t("register")}</button>
	                <button type="button" onClick={() => window.location.href = "/login"} className="register-login">{t("login")}</button>
	            </form>
				
				{message && <p>{message}</p>}
			</div>
        </div>
    );
};

export default SignUpForm;
