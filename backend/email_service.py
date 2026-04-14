import smtplib
import os
import sys
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Re-ensure env vars are loaded
load_dotenv()

def get_smtp_config():
    """Retrieves SMTP configuration from environment variables with safety checks."""
    
    # Safety check for PORT to prevent crashes if it's empty or invalid
    port_env = os.getenv("SMTP_PORT", "587")
    try:
        if not port_env or not str(port_env).strip():
            port = 587
        else:
            port = int(str(port_env).strip())
    except (ValueError, TypeError):
        print(f"[SMTP WARNING] Invalid SMTP_PORT '{port_env}'. Defaulting to 587.", flush=True)
        port = 587

    return {
        "SERVER": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "PORT": port,
        "USERNAME": os.getenv("SMTP_USERNAME", ""),
        "PASSWORD": os.getenv("SMTP_PASSWORD", ""),
        "FRONTEND_URL": os.getenv("FRONTEND_URL", "https://cs-star.onrender.com").rstrip("/")
    }

def _send_smtp_email(to_email: str, subject: str, html_body: str):
    """
    Unified helper to send SMTP emails with deep diagnostic logging for 
    troubleshooting cloud environments like Render.
    """
    # 0. IMMEDIATE LOG (before anything else)
    print(f"\n[SMTP DEBUG] _send_smtp_email function started for: {to_email}", flush=True)
    sys.stdout.flush()
    
    try:
        config = get_smtp_config()
        
        # 1. Deep Diagnostics for Render Logs
        print(f"[SMTP DEBUG] --- START EMAIL ATTEMPT ---", flush=True)
        print(f"[SMTP DEBUG] Subject: {subject}", flush=True)
        print(f"[SMTP DEBUG] Destination: {to_email}", flush=True)
        print(f"[SMTP DEBUG] Config - Server: {config['SERVER']} | Port: {config['PORT']}", flush=True)
        
        # Masking sensitive details for security while still providing clues
        masked_user = "MISSING"
        if config['USERNAME']:
            parts = config['USERNAME'].split('@')
            if len(parts) > 1:
                masked_user = f"{parts[0][:3]}***@{parts[1]}"
            else:
                masked_user = f"{config['USERNAME'][:3]}***"
                
        print(f"[SMTP DEBUG] Config - Username: {masked_user}", flush=True)
        print(f"[SMTP DEBUG] Config - Password Length: {len(config['PASSWORD']) if config['PASSWORD'] else 0}", flush=True)
        print(f"[SMTP DEBUG] Config - Frontend URL: {config['FRONTEND_URL']}", flush=True)

        # 2. Check for missing configuration
        if not config['USERNAME'] or not config['PASSWORD']:
            print(f"[SMTP MOCK] Missing SMTP_USERNAME or SMTP_PASSWORD in environment.", flush=True)
            print(f"[SMTP MOCK] If this is Production, please set these in your dashboard.", flush=True)
            print(f"[SMTP MOCK] Pre-render length: {len(html_body)} bytes", flush=True)
            print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (MOCK MODE) ---\n", flush=True)
            return True

        msg = MIMEMultipart()
        msg['From'] = config['USERNAME']
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_body, 'html'))

        # 3. Execution
        try:
            if config['PORT'] == 465:
                print("[SMTP DEBUG] Using smtplib.SMTP_SSL (Implicit SSL/TLS for port 465)", flush=True)
                server = smtplib.SMTP_SSL(config['SERVER'], config['PORT'], timeout=20)
            else:
                print(f"[SMTP DEBUG] Using smtplib.SMTP with STARTTLS for port {config['PORT']}", flush=True)
                server = smtplib.SMTP(config['SERVER'], config['PORT'], timeout=20)
                server.starttls()
                
            print("[SMTP DEBUG] Connection established. Attempting login...", flush=True)
            server.login(config['USERNAME'], config['PASSWORD'])
            
            print("[SMTP DEBUG] Login successful. Sending message...", flush=True)
            server.send_message(msg)
            server.quit()
            print(f"[SMTP SUCCESS] Email successfully delivered to {to_email}", flush=True)
            print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (SUCCESS) ---\n", flush=True)
            return True

        except smtplib.SMTPAuthenticationError:
            print(f"[SMTP ERROR] Authentication Failed. Double-check your App Password.", flush=True)
            print(f"[SMTP ERROR] Ensure you are not using your normal Gmail password, but a 16-character App Password.", flush=True)
        except (smtplib.SMTPConnectError, ConnectionRefusedError):
            print(f"[SMTP ERROR] Connection Failed. The server at {config['SERVER']} rejected the connection on port {config['PORT']}.", flush=True)
        except Exception as e:
            print(f"[SMTP ERROR] Unexpected SMTP sub-error: {type(e).__name__}: {str(e)}", flush=True)
            traceback.print_exc()
            sys.stdout.flush()

    except Exception as e:
        print(f"[SMTP ERROR] CRITICAL unexpected function error: {type(e).__name__}: {str(e)}", flush=True)
        traceback.print_exc()
        sys.stdout.flush()
    
    print(f"[SMTP DEBUG] --- END EMAIL ATTEMPT (FAILURE) ---\n", flush=True)
    return False

def send_reset_email(to_email: str, token: str):
    # Log function entry
    print(f"[SMTP DEBUG] send_reset_email function entered for {to_email}", flush=True)
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
    # Log function entry
    print(f"[SMTP DEBUG] send_verification_email function entered for {to_email}", flush=True)
    body = f"""
    <p>Welcome to CS-Star!</p>
    <p>Your verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    <p>Please enter this code to activate your account.</p>
    """
    return _send_smtp_email(to_email, "CS-Star: Verify your email", body)
