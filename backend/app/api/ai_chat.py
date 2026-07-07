"""Agentic AI chat endpoint — tool-use powered maritime assistant"""
import time
from collections import defaultdict, deque
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from app.database import get_db
from app.ai_service import ai_service
from app import models
from app.auth_utils import get_optional_user

router = APIRouter()

# The chat endpoint stays open so landing-page visitors can try the demo
# widget, but each Claude call costs real money. Anonymous traffic is capped
# per IP; signed-in users are not limited. In-memory state is sufficient for
# a single-instance deployment.
ANON_CHAT_LIMIT = 10
ANON_CHAT_WINDOW_SECONDS = 3600
_anon_chat_hits: dict[str, deque] = defaultdict(deque)


def enforce_anon_rate_limit(ip: str) -> None:
    now = time.monotonic()
    hits = _anon_chat_hits[ip]
    while hits and now - hits[0] > ANON_CHAT_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= ANON_CHAT_LIMIT:
        raise HTTPException(
            status_code=429,
            detail="Demo limit reached for now. Sign in to keep using the AI assistant.",
        )
    hits.append(now)
    # Keep the table from growing without bound under address churn.
    if len(_anon_chat_hits) > 5000:
        for key in [k for k, v in _anon_chat_hits.items() if not v]:
            del _anon_chat_hits[key]


class ChatRequest(BaseModel):
    message: str
    history: list[Any] = []
    context: dict[str, Any] = {}


@router.post("/")
async def chat(
    req: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User | None = Depends(get_optional_user),
):
    """Agentic chat endpoint — Claude with 17 maritime tools."""
    if current_user is None:
        client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
            request.client.host if request.client else "unknown"
        )
        enforce_anon_rate_limit(client_ip)
    try:
        result = ai_service.chat_with_tools(req.message, req.history, req.context, db)
        return result
    except Exception as e:
        return {
            "reply": f"Unexpected server error: {str(e)[:200]}",
            "history": req.history,
            "tools_used": [],
        }
