from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_translator import GoogleTranslator

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranslateRequest(BaseModel):
    text: str

MAX_CHUNK_SIZE = 3000  # 🔥 안전하게 3000자로 제한

def split_text(text, size=MAX_CHUNK_SIZE):
    return [text[i:i+size] for i in range(0, len(text), size)]

@app.post("/translate")
def translate(req: TranslateRequest):
    original_text = req.text.strip()

    if not original_text:
        return {"translated": ""}

    try:
        translator = GoogleTranslator(source="auto", target="ko")

        chunks = split_text(original_text)
        translated_chunks = []

        for idx, chunk in enumerate(chunks):
            print(f"🔄 번역 chunk {idx+1}/{len(chunks)}")
            translated = translator.translate(chunk)
            translated_chunks.append(translated)

        final_text = "\n".join(translated_chunks)

        return {
            "translated": final_text
        }

    except Exception as e:
        print("❌ 번역 실패:", e)
        return {
            "translated": "번역 중 오류가 발생했습니다."
        }
