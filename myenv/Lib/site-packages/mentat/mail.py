# -*- coding: utf-8 -*-

from email.mime.text import MIMEText
from smtplib import SMTP

def send (address, sender, recipient, subject, content):
    """Send MIME message from string."""
    smtp = SMTP(address)
    mime = MIMEText(content)
    mime["From"] = sender
    mime["To"] = recipient
    mime["Subject"] = subject
    smtp.sendmail(sender, recipient, mime.as_string())
    smtp.quit()