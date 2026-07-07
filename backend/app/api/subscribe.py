"""Subscription / trial request endpoint"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging
import html as html_lib
import resend
from app.config import settings
from concurrent.futures import ThreadPoolExecutor
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()
_executor = ThreadPoolExecutor(max_workers=2)


class SubscribeRequest(BaseModel):
    name: str
    email: str
    company: str
    role: str
    message: Optional[str] = None


def _send_notification(data: SubscribeRequest):
    api_key = settings.RESEND_API_KEY
    notify_to = settings.NOTIFY_EMAIL

    if not api_key or not notify_to:
        logger.warning("RESEND_API_KEY or NOTIFY_EMAIL not configured; skipping email.")
        return

    resend.api_key = api_key

    name = html_lib.escape(data.name)
    email = html_lib.escape(data.email)
    company = html_lib.escape(data.company)
    role = html_lib.escape(data.role)
    message = html_lib.escape(data.message) if data.message else '<em style="color:#999;">none</em>'

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
    New Access Request &mdash; MarineOS
  </h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin-top: 16px;">
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; width: 120px;">Name</td>
      <td style="padding: 10px 14px;">{name}</td>
    </tr>
    <tr style="background:#f7f9fb;">
      <td style="padding: 10px 14px; font-weight: bold;">Email</td>
      <td style="padding: 10px 14px;"><a href="mailto:{email}">{email}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: bold;">Company</td>
      <td style="padding: 10px 14px;">{company}</td>
    </tr>
    <tr style="background:#f7f9fb;">
      <td style="padding: 10px 14px; font-weight: bold;">Role</td>
      <td style="padding: 10px 14px;">{role}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; vertical-align: top;">Message</td>
      <td style="padding: 10px 14px;">{message}</td>
    </tr>
  </table>
  <p style="margin-top: 24px; font-size: 12px; color: #888;">
    This notification was sent automatically by MarineOS.
  </p>
</body></html>
"""

    try:
        resend.Emails.send({
            "from": "MarineOS <noreply@marineos.app>",
            "to": [notify_to],
            "subject": f"New Access Request: {data.name} from {data.company}",
            "html": html,
        })
        logger.info("Notification email sent to %s", notify_to)
    except Exception as exc:
        logger.error("Failed to send notification email: %s", exc)


@router.post("/", response_model=dict)
async def subscribe(data: SubscribeRequest):
    """Record a subscription or trial request from the landing page."""
    logger.info(
        "New subscription request: %s <%s> @ %s [%s]",
        data.name, data.email, data.company, data.role,
    )
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_executor, _send_notification, data)
    return {
        "status": "success",
        "message": f"Thank you {data.name}. We'll be in touch at {data.email} shortly.",
    }
