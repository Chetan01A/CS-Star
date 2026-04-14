import smtplib
import os
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Re-ensure env vars are loaded
load_dotenv()

def get_smtp_config():
    """Retrieves SMTP configuration from environment variables."""
    return {
        "SERVER": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "PORT": int(os.getenv("SMTP_PORT", 587)),
        "USERNAME": os.getenv("SMTP_USERNAME", ""),
        "PASSWORD": os.getenv("SMTP_PASSWORD", ""),
        "FRONTEND_URL": os.getenv("FRONTEND_URL", "https://cs-star.onrender.com").rstrip("/")
    }

def _send_smtp_email(to_email: str, subject: str, html_body: str):
    """
    Unified helper to send SMTP emails with deep diagnostic logging for 
    troubleshooting cloud environments like Render.
    """
    config = get_smtp_config()
    
    # 1. Deep Diagnostics for Render Logs
    print(f"\n[SMTP DEBUG] --- START EMAIL ATTEMPT ---")
    print(f"[SMTP DEBUG] Subject: {subject}")
    print(f"[SMTP DEBUG] Destination: {to_email}")
    print(f"[SMTP DEBUG] Config - Server: {config['SERVER']} | Port: {config['PORT']}")
    
    # Masking sensitive details for security while still providing clues
    masked_user = "MISSING"
    if config['USERNAME']:
        parts = config['USERNAME'].split('@')
        if len(parts) > 1:
            masked_user = f"{parts[0][:3]}***@{parts[1]}"
        else:
            masked_user = f"{config['USERNAME'][:3]}***"
            
    print(f"[SMTP DEBUG] Config - Username: {masked_user}")
    print(f"[SMTP DEBUG] Config - Password Length: {len(config['PASSWORD']) if config['PASSWORD'] else 0}")
    print(f"[SMTP DEBUG] Config - Frontend URL: {config['FRONTEND_URL']}")

    # 2. Check for missing configuration
    if not config['USERNAME'] or not config['PASSWORD']:
        print(f"[SMTP MOCK] Missing SMTP_USERNAME or SMTP_PASSWORD in environment.")
        print(f"[SMTP MOCK] If this is Production, please set these in your dashboard.")
        print(f"[SMTP MOCK] Pre-rendered Body Snippet: {html_body[:60]}...")
        print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (MOCK MODE) ---\n")
        return True

    msg = MIMEMultipart()
    msg['From'] = config['USERNAME']
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(html_body, 'html'))

    # 3. Execution
    try:
        if config['PORT'] == 465:
            print("[SMTP DEBUG] Using smtplib.SMTP_SSL (Implicit SSL/TLS for port 465)")
            server = smtplib.SMTP_SSL(config['SERVER'], config['PORT'], timeout=15)
        else:
            print(f"[SMTP DEBUG] Using smtplib.SMTP with STARTTLS for port {config['PORT']}")
            server = smtplib.SMTP(config['SERVER'], config['PORT'], timeout=15)
            server.starttls()
            
        print("[SMTP DEBUG] Connection established. Attempting login...")
        server.login(config['USERNAME'], config['PASSWORD'])
        
        print("[SMTP DEBUG] Login successful. Sending message...")
        server.send_message(msg)
        server.quit()
        print(f"[SMTP SUCCESS] Email successfully delivered to {to_email}")
        print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (SUCCESS) ---\n")
        return True

    except smtplib.SMTPAuthenticationError:
        print(f"[SMTP ERROR] Authentication Failed. Double-check your App Password.")
        print(f"[SMTP ERROR] Ensure you are not using your normal Gmail password, but a 16-character App Password.")
        traceback.print_exc()
    except smtplib.SMTPConnectError:
        print(f"[SMTP ERROR] Connection Failed. The server at {config['SERVER']} rejected the connection on port {config['PORT']}.")
    except Exception as e:
        print(f"[SMTP ERROR] Unexpected error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
    
    print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (FAILURE) ---\n")
    return False

def send_reset_email(to_email: str, token: str):
    config = get_smtp_config()
    reset_link = f"{config['FRONTEND_URL']}/reset-password?token={token}"
    
    body = f"""
    <p>Hello,</p>
    <p>You requested a password reset. Click the link below to securely create a new password:</p>
    <p><a href="{reset_link}">{reset_link}</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """
    return _send_smtp_email(to_email, "CS-Star: Password Reset Request", body)

def send_verification_email(to_email: str, code: str):
    body = f"""
    <p>Welcome to CS-Star!</p>
    <p>Your verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    <p>Please enter this code to activate your account.</p>
    """
    return _send_smtp_email(to_email, "CS-Star: Verify your email", body)
