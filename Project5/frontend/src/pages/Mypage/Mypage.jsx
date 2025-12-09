import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Mypage.css";

const Mypage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [sessionRes, infoRes] = await Promise.all([
                    axios.get("http://localhost:8585/api/auth/session/user", { withCredentials: true }),
                    axios.get("http://localhost:8585/api/info", { withCredentials: true })
                ]);

                console.log("세션 정보:", sessionRes.data);
                console.log("추가 정보:", infoRes.data);

                // 두 데이터 병합
                const mergedUser = {
                    ...sessionRes.data,
                    ...infoRes.data,
                };

                if (sessionRes.data || infoRes.data) {
                    setUser(mergedUser);
                }

            } catch (err) {
                console.error("사용자 정보 조회 실패:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) return <p>불러오는 중...</p>;
    if (!user) return <p>로그인이 필요합니다.</p>;

    // 회원 탈퇴 실행
    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("정말로 회원 탈퇴하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const res = await axios.post(
                "http://localhost:8585/api/deleteUser",
                {},
                { withCredentials: true }
            );

            if (res.data === 1) {
                alert("회원 탈퇴 완료");
                window.location.href = "/";
            } else {
                alert("회원 탈퇴 실패");
            }
        } catch (err) {
            console.error(err);
            alert("오류 발생");
        }
    };

    return (
        <div className="mypage-wrap">
            <div className="mypage-container">
                <h2 className="mypage-title">마이페이지</h2>

				<img
				  src={
				    user.profileImage
				      ? user.profileImage.startsWith("http") // 외부 URL이면 그대로
				        ? user.profileImage
				        : `http://localhost:8585/uploads/${encodeURIComponent(user.profileImage)}` // 서버 저장 파일이면 uploads 경로
				      : "/Default-Profile.png"
				  }
				  alt="프로필"
				  className="user-profileImage"
				/>


                <div className="user-info-box">
                    <p><strong>아이디:</strong> {user.userId}</p>
                    <p><strong>닉네임:</strong> {user.nickname}</p>
                    <p><strong>이메일:</strong> {user.email}</p>
                    <p><strong>가입일:</strong> {user.createdAt}</p>
                    <p><strong>로그인 방식:</strong> {user.loginType === "KAKAO" ? "카카오 로그인" : "일반 로그인"}</p>
                </div>

                <div>
                    {/* LOCAL 로그인일 때만 회원정보 수정 버튼 표시 */}
                    {user.loginType === "LOCAL" && (
                        <button
                            className="modify_link"
                            onClick={() => navigate("/updateMypage")}
                        >
                            회원정보 수정
                        </button>
                    )}

                    <button className="delete-btn" onClick={handleDeleteAccount}>
                        회원 탈퇴
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Mypage;
