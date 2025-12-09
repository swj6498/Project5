import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UpdateMypage.css";

const ModifyUserInfo = () => {
    const [user, setUser] = useState(null);

    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // 비밀번호 유효성 체크: 8자 이상, 특수문자 포함
    const passwordValidation = (password) => {
        const regex = /^(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    };

    // 유저 정보 불러오기
	useEffect(() => {
	    axios
	        .get("http://localhost:8585/api/info", { withCredentials: true })
	        .then((res) => {
	            setUser(res.data);
	            setEmail(res.data.email);
	            setNickname(res.data.nickname);

	            // 기존 이미지가 있을 경우 전체 URL로 변환
	            if (res.data.profileImage) {
	                setPreview(`http://localhost:8585/uploads/${encodeURIComponent(res.data.profileImage)}`);
	            }
	        })
	        .catch((err) => console.error(err));
	}, []);

    // 이미지 미리보기
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setProfileImage(file);
        setPreview(URL.createObjectURL(file));
    };

    // 정보 수정 전송
    const handleSubmit = () => {
        setErrorMsg("");

        // 비밀번호 유효성 체크
        if (password && !passwordValidation(password)) {
            setErrorMsg("비밀번호는 8자 이상이고 특수문자를 포함해야 합니다.");
            return;
        }

        // DTO 필드명 기준으로 FormData 생성
        const formData = new FormData();
        formData.append("user_id", user.userId);           // DTO: user_id
        formData.append("email", email);
        formData.append("nickname", nickname);
        if (password) formData.append("user_password", password); // DTO: user_password
        if (profileImage) formData.append("profileImage", profileImage);

        axios
            .post("http://localhost:8585/api/modifyUser", formData, {
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((res) => {
                if (res.data === 1) {
                    alert("회원 정보가 수정되었습니다!");
                    window.location.href = "/mypage";
                } else {
                    alert("수정 실패");
                }
            })
            .catch((err) => {
                console.error(err);
                alert("오류 발생: 서버에서 데이터를 받지 못했습니다.");
            });
    };

    if (!user) return <p>불러오는 중...</p>;

    return (
        <div className="modify-container">
            <div className="modify-card">
                <h2 className="modify-title">회원정보 수정</h2>

                <div className="profile-area">
                    <img
                        src={preview ? preview : "/Default-Profile.png"}
                        alt="프로필 미리보기"
                        className="profile-preview"
                    />
                    <label className="upload-btn">
                        사진 변경
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: "none" }}
                        />
                    </label>
                </div>

                <div className="modify-item">
                    <label>아이디</label>
                    <p className="readonly-box">{user.userId}</p>
                </div>

                <div className="modify-item">
                    <label>이메일</label>
                    <input
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="modify-item">
                    <label>닉네임</label>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                    />
                </div>

                <div className="modify-item">
                    <label>비밀번호 변경 (선택)</label>
                    <input
                        type="password"
                        placeholder="새 비밀번호 입력"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {errorMsg && <p className="error-msg">{errorMsg}</p>}

                <button className="modify-btn" onClick={handleSubmit}>
                    저장하기
                </button>
            </div>
        </div>
    );
};

export default ModifyUserInfo;
