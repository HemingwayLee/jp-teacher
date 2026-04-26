import os
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="JP Teacher API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ollama_config = {
    "host": os.environ.get("OLLAMA_HOST", "http://host.docker.internal:11434"),
    "model": os.environ.get("OLLAMA_MODEL", "gemma3:12b"),
}

# In-memory vocabulary store (replace with a DB for production)
vocabulary_store: list[dict] = [
    {"id": "1", "japanese": "猫", "reading": "ねこ (neko)", "english": "cat", "level": "N5"},
    {"id": "2", "japanese": "食べる", "reading": "たべる (taberu)", "english": "to eat", "level": "N5"},
    {"id": "3", "japanese": "勉強", "reading": "べんきょう (benkyou)", "english": "study", "level": "N4"},
    {"id": "4", "japanese": "電車", "reading": "でんしゃ (densha)", "english": "train", "level": "N4"},
    {"id": "5", "japanese": "難しい", "reading": "むずかしい (muzukashii)", "english": "difficult", "level": "N4"},
]

SYSTEM_PROMPT = """You are a friendly and encouraging Japanese language teacher named Sensei.
Your role is to help students learn Japanese through conversation, explanation, and practice.

Guidelines:
- When teaching vocabulary or grammar, show the Japanese text, its reading (hiragana/romaji), and meaning.
- Use both Japanese and English in your responses to help learners.
- Correct mistakes gently and explain why something is wrong.
- Provide examples using common, practical Japanese.
- Adapt your teaching level based on the student's apparent level.
- Be encouraging and positive.
- For Japanese text always include: Kanji/Kana | Reading | Meaning format when introducing new words.
"""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class TranslateRequest(BaseModel):
    text: str
    direction: str  # "en-ja" or "ja-en"


class VocabularyWord(BaseModel):
    japanese: str
    reading: Optional[str] = ""
    english: str
    level: str = "N5"


async def ollama_chat(messages: list[dict], timeout: float = 120.0) -> str:
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{ollama_config['host']}/api/chat",
            json={"model": ollama_config["model"], "messages": messages, "stream": False},
        )
        response.raise_for_status()
        return response.json()["message"]["content"]


@app.get("/api/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{ollama_config['host']}/api/tags")
            r.raise_for_status()
        return {"status": "ok", "ollama": "reachable"}
    except Exception:
        return {"status": "ok", "ollama": "unreachable"}


class SettingsPayload(BaseModel):
    host: str
    model: str


@app.get("/api/settings")
def get_settings():
    return {"host": ollama_config["host"], "model": ollama_config["model"]}


@app.post("/api/settings")
def update_settings(payload: SettingsPayload):
    ollama_config["host"] = payload.host.rstrip("/")
    ollama_config["model"] = payload.model
    return {"host": ollama_config["host"], "model": ollama_config["model"]}


@app.post("/api/settings/test")
async def test_connection(payload: SettingsPayload):
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{payload.host.rstrip('/')}/api/tags")
            r.raise_for_status()
            models = [m["name"] for m in r.json().get("models", [])]
        return {"status": "ok", "models": models}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += [{"role": m.role, "content": m.content} for m in req.history]
    messages.append({"role": "user", "content": req.message})
    reply = await ollama_chat(messages)
    return {"response": reply}


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    if req.direction == "en-ja":
        prompt = (
            "Translate the following English text to Japanese. "
            "Provide kanji/kana with furigana reading in parentheses. "
            "Return only the translation.\n\n"
            f"Text: {req.text}"
        )
    else:
        prompt = (
            "Translate the following Japanese text to English. "
            "Return only the translation.\n\n"
            f"Text: {req.text}"
        )
    reply = await ollama_chat([{"role": "user", "content": prompt}], timeout=60.0)
    return {"translation": reply}


@app.get("/api/vocabulary")
def get_vocabulary():
    return vocabulary_store


@app.post("/api/vocabulary")
def create_vocabulary(word: VocabularyWord):
    new_word = {"id": str(uuid.uuid4()), **word.model_dump()}
    vocabulary_store.append(new_word)
    return new_word


@app.delete("/api/vocabulary/{word_id}")
def delete_vocabulary(word_id: str):
    global vocabulary_store
    original_len = len(vocabulary_store)
    vocabulary_store = [w for w in vocabulary_store if w["id"] != word_id]
    if len(vocabulary_store) == original_len:
        raise HTTPException(status_code=404, detail="Word not found")
    return {"deleted": word_id}
