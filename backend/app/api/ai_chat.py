"""Agentic AI chat endpoint — tool-use powered maritime assistant"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from app.database import get_db
from app.ai_service import ai_service
from app import models
from app.auth_utils import get_current_user

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[Any] = []
    context: dict[str, Any] = {}


@router.post("/")
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Agentic chat endpoint — Claude with 17 maritime tools."""
    try:
        result = ai_service.chat_with_tools(req.message, req.history, req.context, db)
        return result
    except Exception as e:
        return {
            "reply": f"Unexpected server error: {str(e)[:200]}",
            "history": req.history,
            "tools_used": [],
        }
