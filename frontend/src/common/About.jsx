import React from "react";
import { Box, Card, CardContent, Typography, Grid, Chip, Divider } from "@mui/material";
import { DataObject, Insights, Build, Storage, People, CheckCircle } from "@mui/icons-material";

const About = ({ cardWidths = {} }) => {
    const teamMembers = [
        { name: "정태규(팀장)", role: "실시간 국내 주식 데이터 처리 및 페이지 제작, AI 오타 보정, 형태소 분석 등 검색 시스템 구현" },
        { name: "손원주, 지윤정", role: "뉴스 페이지 검색 엔진 제작(형태소 분석, TF-IDF 랭킹, 챗봇)" },
        { name: "서원희, 조슬미", role: "실시간 뉴스 크롤링, 대규모 데이터 처리, 뉴스 페이지 제작" },
        { name: "구현서", role: "로그인/회원가입(소셜 로그인 포함) 및 보안 구현, UI 다국어 기능 제작" },
    ];

    const techStack = [
        "Python", "Spring Boot", "Redis", "Render", "VSCode", "STS4", "IntelliJ",
        "Ubuntu", "OpenAI", "Perplexity", "MongoDB Atlas", "Oracle Database",
        "Vite+React", "MUI", "Axios", "JavaScript", "Node.js",
    ];

    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 4 }}>
            <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: "bold", mb: 6 }}>
                About Our Project
            </Typography>

            {/* 상단 카드: 프로젝트 소개 */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={12}>
                    <Card sx={{ borderRadius: 3, boxShadow: 5, p: 2, backgroundColor: "#fafafa" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <DataObject sx={{ fontSize: 30, mr: 1, color: "#1976d2" }} />
                                <Typography variant="h5" sx={{ fontWeight: "bold" }}>프로젝트 소개</Typography>
                            </Box>
                            <Typography variant="body1" color="#555" sx={{ mb: 2 }}>
                                Python 기반 빅데이터 웹 검색 엔진 프로젝트입니다. 웹 로봇으로 데이터를 수집하고, 형태소 분석 및 TF-IDF 기반 랭킹을 통해 검색 결과를 제공합니다. 또한 AI 기반 오타 교정과 검색어 추천 기능을 활용해 사용자 편의성을 강화했습니다.
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                                <Chip label="실시간 검색" icon={<CheckCircle />} color="primary" />
                                <Chip label="AI 추천" icon={<CheckCircle />} color="success" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 중단 카드: 주요 기능 + 기술 스택 나란히 */}
            <Grid container spacing={4} sx={{ mt: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: 5, p: 2, backgroundColor: "#fff" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Insights sx={{ fontSize: 28, mr: 1, color: "#ff9800" }} />
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>주요 기능</Typography>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Chip label="사이트 데이터 크롤링" variant="outlined" />
                                <Chip label="TF-IDF 검색 결과 랭킹" variant="outlined" />
                                <Chip label="AI 오타 교정 & 검색어 추천" variant="outlined" />
                                <Chip label="실시간 검색 결과 제공" variant="outlined" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3, boxShadow: 5, p: 2, backgroundColor: "#fff" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Build sx={{ fontSize: 28, mr: 1, color: "#009688" }} />
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>기술 스택</Typography>
                            </Box>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {techStack.map((tech, idx) => (
                                    <Chip key={idx} label={tech} variant="outlined" />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 하단 카드: 배운 점 */}
            <Grid container spacing={4} sx={{ mt: 4 }}>
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: 3, boxShadow: 5, p: 2, backgroundColor: "#fafafa" }}>
                        <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                <Storage sx={{ fontSize: 28, mr: 1, color: "#607d8b" }} />
                                <Typography variant="h6" sx={{ fontWeight: "bold" }}>배운 점</Typography>
                            </Box>
                            <Typography variant="body1" color="#555">
                                대규모 데이터 처리, TF-IDF 랭킹, AI 추천 시스템 구현 경험을 통해 검색 엔진 최적화와 데이터 처리 효율성을 향상시켰습니다. 팀 협업으로 문제 해결 능력도 강화했습니다.
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 팀원 카드 */}
            <Box sx={{ mt: 4 }}>
                <Card sx={{ borderRadius: 3, boxShadow: 5, p: 2, backgroundColor: "#fff" }}>
                    <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                            <People sx={{ fontSize: 28, mr: 1, color: "#ff5722" }} />
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>참여 팀원</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {teamMembers.map((member, idx) => (
                                <Box key={idx} sx={{ p: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                        {member.name}
                                    </Typography>
                                    <Typography variant="body2" color="#555">
                                        {member.role}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default About;
