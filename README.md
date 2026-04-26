# JP Teacher

A Japanese language learning web app powered by a local Ollama model.

**Features:**
- **Chat** — Converse with an AI Japanese teacher; speak with the 🎤 mic button (STT via Web Speech API)
- **Vocabulary** — Build a personal word list with JLPT level tags (N5–N1)
- **Translate** — English ↔ Japanese translation with furigana readings

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + MUI v6 + Vite |
| Backend | FastAPI (Python) |
| AI | Ollama — `gemma3:12b` |
| Container | Docker + docker-compose |

## Prerequisites

Ollama must be running on your host machine with the model pulled:
```bash
ollama pull gemma3:12b
```

## Development (hot reload)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

- Frontend HMR via Vite → `http://localhost:3000`
- Backend auto-reload via uvicorn `--reload` → `http://localhost:8000`
- Edit files on your host; changes reflect instantly in the container.

## Production

```bash
docker-compose up --build
```

Serves an optimised Vite build behind nginx on `http://localhost:3000`.

## Local Development (no Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
OLLAMA_HOST=http://localhost:11434 uvicorn main:app --reload
```

**Frontend** (update proxy target to `http://localhost:8000` in `vite.config.js`):
```bash
cd frontend
npm install
npm run dev
```
