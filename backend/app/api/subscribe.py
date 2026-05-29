"""Subscription / trial request endpoint"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import logging
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
    host = settings.EMAIL_HOST
    port = settings.EMAIL_PORT
    username = settings.EMAIL_USERNAME
    password = settings.EMAIL_PASSWORD
    notify_to = settings.NOTIFY_EMAIL

    if not username or not password or password == "your-yahoo-app-password-here":
        logger.warning(
            "Email credentials not configured; skipping notification email.")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Access Request: {data.name} from {data.company}"
    msg["From"] = username
    msg["To"] = notify_to

    plain = (
        f"New access request received on MarineDoc System:\n\n"
        f"Name:     {data.name}\n"
        f"Email:    {data.email}\n"
        f"Company:  {data.company}\n"
        f"Role:     {data.role}\n"
        f"Message:  {data.message or '(none)'}\n"
    )

    html = f"""
<html><body style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
  <h2 style="color: #1a5f7a; border-bottom: 2px solid #1a5f7a; padding-bottom: 8px;">
    New Access Request &mdash; MarineDoc System
  </h2>
  <table style="border-collapse: collapse; width: 100%; max-width: 560px; margin-top: 16px;">
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; width: 120px;">Name</td>
      <td style="padding: 10px 14px;">{data.name}</td>
    </tr>
    <tr style="background:#f7f9fb;">
      <td style="padding: 10px 14px; font-weight: bold;">Email</td>
      <td style="padding: 10px 14px;"><a href="mailto:{data.email}">{data.email}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: bold;">Company</td>
      <td style="padding: 10px 14px;">{data.company}</td>
    </tr>
    <tr style="background:#f7f9fb;">
      <td style="padding: 10px 14px; font-weight: bold;">Role</td>
      <td style="padding: 10px 14px;">{data.role}</td>
    </tr>
    <tr>
      <td style="padding: 10px 14px; font-weight: bold; vertical-align: top;">Message</td>
      <td style="padding: 10px 14px;">{data.message or '<em style="color:#999;">none</em>'}</td>
    </tr>
  </table>
  <p style="margin-top: 24px; font-size: 12px; color: #888;">
    This notification was sent automatically by MarineDoc System.
  </p>
</body></html>
"""

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls(context=ssl.create_default_context())
            server.ehlo()
            server.login(username, password)
            server.sendmail(username, notify_to, msg.as_string())
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
