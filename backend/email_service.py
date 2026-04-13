import smtplib
import os
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Re-ensure env vars are loaded
load_dotenv()

def get_smtp_config():
    return {
        "SERVER": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "PORT": int(os.getenv("SMTP_PORT", 587)),
        "USERNAME": os.getenv("SMTP_USERNAME", ""),
        "PASSWORD": os.getenv("SMTP_PASSWORD", ""),
        "FRONTEND_URL": os.getenv("FRONTEND_URL", "https://cs-star.vercel.app").rstrip("/")
    }

def send_reset_email(to_email: str, token: str):
    config = get_smtp_config()
    reset_link = f"{config['FRONTEND_URL']}/reset-password?token={token}"
    
    msg = MIMEMultipart()
    msg['From'] = config['USERNAME']
    msg['To'] = to_email
    msg['Subject'] = "CS-Star: Password Reset Request"
    
    body = f"""
    <p>Hello,</p>
    <p>You requested a password reset. Click the link below to securely create a new password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """
    msg.attach(MIMEText(body, 'html'))
    
    try:
        if not config['USERNAME'] or not config['PASSWORD']:
            print(f"\n[EMAIL MOCK] Email would be sent to {to_email}")
            print(f"[EMAIL MOCK] Content Reset Link: {reset_link}\n")
            return True
            
        server = smtplib.SMTP(config['SERVER'], config['PORT'])
        server.starttls()
        server.login(config['USERNAME'], config['PASSWORD'])
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent reset email to {to_email}")
        return True
    except Exception as e:
        print(f"CRITICAL: Failed to send reset email: {e}")
        traceback.print_exc()
        return False

def send_verification_email(to_email: str, code: str):
    config = get_smtp_config()
    msg = MIMEMultipart()
    msg['From'] = config['USERNAME']
    msg['To'] = to_email
    msg['Subject'] = "CS-Star: Verify your email"
    
    body = f"""
    <p>Welcome to CS-Star!</p>
    <p>Your verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    <p>Please enter this code to activate your account.</p>
    """
    msg.attach(MIMEText(body, 'html'))
    
    try:
        if not config['USERNAME'] or not config['PASSWORD']:
            print(f"\n[EMAIL MOCK] Verification Email for {to_email}")
            print(f"[EMAIL MOCK] Your 6-digit code is: {code}")
            print("[EMAIL MOCK] (Reason: SMTP_USERNAME or SMTP_PASSWORD not set in .env)\n")
            return True
            
        print(f"Attempting to send verification email to {to_email} via {config['SERVER']}...")
        server = smtplib.SMTP(config['SERVER'], config['PORT'], timeout=10)
        server.starttls()
        server.login(config['USERNAME'], config['PASSWORD'])
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent verification email to {to_email}")
        return True
    except Exception as e:
        print(f"CRITICAL: Failed to send verification email to {to_email}: {e}")
        traceback.print_exc()
        return False
