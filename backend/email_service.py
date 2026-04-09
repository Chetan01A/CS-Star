import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# TODO: For a production app, these should go in a .env file
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-app-email@gmail.com"
SMTP_PASSWORD = "your-app-password"
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://cs-star.vercel.app").rstrip("/")

def send_reset_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
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
        # Development override: just print to console to prove it works
        print(f"\n[EMAIL MOCK] Email would be sent to {to_email}")
        print(f"[EMAIL MOCK] Content Reset Link: {reset_link}\n")
        
        # When you have real credentials, uncomment the following lines to actually send the email:
        '''
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        '''
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_verification_email(to_email: str, code: str):
    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = to_email
    msg['Subject'] = "CS-Star: Verify your email"
    
    body = f"""
    <p>Welcome to CS-Star!</p>
    <p>Your verification code is: <strong style="font-size: 24px;">{code}</strong></p>
    <p>Please enter this code to activate your account.</p>
    """
    msg.attach(MIMEText(body, 'html'))
    
    try:
        # Development override:
        print(f"\n[EMAIL MOCK] Verification Email to {to_email}")
        print(f"[EMAIL MOCK] Your 6-digit code is: {code}\n")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
