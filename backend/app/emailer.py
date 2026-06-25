from __future__ import annotations

import ssl
import logging
import smtplib
from email.message import EmailMessage

from app.settings import get_settings

logger = logging.getLogger(__name__)


class EmailDeliveryError(RuntimeError):
    pass


def _resolve_sender(settings) -> str:
    sender = settings.smtp_from_email or settings.smtp_username
    if not sender:
        raise EmailDeliveryError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM_EMAIL."
        )
    return sender


def send_email(recipient: str, subject: str, body: str) -> None:
    settings = get_settings()
    if not settings.smtp_host:
        raise EmailDeliveryError("SMTP host is not configured. Set SMTP_HOST to smtp.gmail.com.")
    if not settings.smtp_username or not settings.smtp_password:
        raise EmailDeliveryError(
            "SMTP credentials are missing. For Gmail, enable 2FA and use an App Password in SMTP_PASSWORD."
        )

    sender = _resolve_sender(settings)
    if settings.smtp_use_ssl and settings.smtp_use_starttls:
        raise EmailDeliveryError("SMTP_USE_SSL and SMTP_USE_STARTTLS cannot both be enabled.")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.mail_from_name} <{sender}>"
    message["To"] = recipient
    message.set_content(body)

    timeout = settings.smtp_timeout_seconds
    try:
        if settings.smtp_use_ssl:
            context = ssl.create_default_context()
            client_ctx = smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=timeout, context=context)
        else:
            client_ctx = smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=timeout)

        with client_ctx as client:
            client.ehlo()
            if settings.smtp_use_starttls and not settings.smtp_use_ssl:
                client.starttls(context=ssl.create_default_context())
                client.ehlo()
            client.login(settings.smtp_username, settings.smtp_password)
            client.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        raise EmailDeliveryError(
            "Gmail rejected SMTP login. Check that 2FA is enabled and SMTP_PASSWORD is a Gmail App Password."
        ) from exc
    except smtplib.SMTPException as exc:
        raise EmailDeliveryError(f"SMTP delivery failed: {exc}") from exc
    except OSError as exc:
        raise EmailDeliveryError(f"SMTP connection failed: {exc}") from exc
