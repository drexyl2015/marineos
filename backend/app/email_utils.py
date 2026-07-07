"""Transactional email sending via Resend (HTTPS — Render blocks SMTP ports)."""
import logging
from concurrent.futures import ThreadPoolExecutor
import resend
from app.config import settings

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2)

FROM_ADDRESS = "MarineOS <noreply@marineos.app>"


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured; email to %s not sent (%s)", to, subject)
        return False
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("Email sent to %s (%s)", to, subject)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)
        return False


def send_email_background(to: str, subject: str, html: str) -> None:
    """Fire-and-forget send so request handlers don't wait on the email API."""
    _executor.submit(send_email, to, subject, html)
