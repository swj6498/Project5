from fastapi import FastAPI
from pydantic import BaseModel
import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyCaSrQw_k8jeQUdIlVKIM-tXaHYVBjRLl4"
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash-lite")

app = FastAPI()

class TopDoc(BaseModel):
    title: str
    content: str | None = None

class ChatSummaryRequest(BaseModel):
    query: str
    top_doc: TopDoc | None = None

class ChatSummaryResponse(BaseModel):
    query: str
    summary: str
    news_count: int

def build_summary(query: str, top_doc: TopDoc | None) -> ChatSummaryResponse:
    if top_doc is None:
        prompt = f"""
당신은 금융과 일반 상식을 쉽게 설명해 주는 한국어 도우미입니다.
다음 키워드를 처음 듣는 사람에게 설명하듯이 말해 주세요.

[요청]
- 키워드: '{query}'

[작성 규칙]
- 한국어로 1~2개의 문단으로만 작성합니다.
- 제목, 번호, 불릿 포인트, 마크다운, 기호 리스트를 사용하지 마세요.
- 모든 문장은 공손한 서술형 말투(“~입니다”, “~합니다”)로 작성합니다.
- 자연스럽고 담백한 설명형 문장만 사용하세요.

[출력]
키워드에 대한 설명:
"""
        response = model.generate_content(prompt)
        summary = response.text.strip()
        return ChatSummaryResponse(query=query, summary=summary, news_count=0)

    content = (top_doc.content or "")[:500]
    news_text = f"제목: {top_doc.title}\n내용: {content}\n"

    prompt = f"""
당신은 금융 뉴스와 일반 정보를 쉽게 풀어주는 한국어 도우미입니다.
아래 정보를 바탕으로 하나의 짧은 글을 작성해 주세요.

[입력]
- 사용자가 검색한 키워드: '{query}'
- 관련 뉴스 1건:
{news_text}

[작성 규칙]
- 한국어로 1~2개의 문단만 작성합니다.
- 첫 부분에서는 '{query}'가 무엇인지 간단히 설명하고,
  이어서 위 뉴스의 핵심 내용만 자연스럽게 이어서 설명하세요.
- 제목, 번호, 불릿 포인트, 마크다운, 섹션 구분선 등을 사용하지 마세요.
- "1.", "2." 같은 번호 매기기도 쓰지 마세요.
- 모든 문장은 공손한 서술형 말투(“~입니다”, “~합니다”)로 작성합니다.
- 일상적인 문장 스타일로 부드럽게 서술해 주세요.

[출력]
최종 설명과 뉴스 요약:
"""
    response = model.generate_content(prompt)
    summary = response.text.strip()
    return ChatSummaryResponse(query=query, summary=summary, news_count=1)

@app.post("/chat-summary", response_model=ChatSummaryResponse)
def chat_summary(req: ChatSummaryRequest):
    return build_summary(req.query, req.top_doc)
