import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { MailCheck } from 'lucide-react';
import { motion } from 'framer-motion';

function VerifyEmail() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('signup_email');
    if (!savedEmail) {
      navigate('/signup');
    } else {
      setEmail(savedEmail);
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-email', {
        email,
        code,
      });

      localStorage.removeItem('signup_email');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [resendCooldown, setResendCooldown] = useState(0);
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/resend-verification', { email });
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card glass"
      >
        <MailCheck size={48} color="var(--accent-color)" style={{ marginBottom: '24px' }} />
        <h2 className="gradient-text">Verify Your Email</h2>
        <p style={{ marginBottom: '32px' }}>We sent a code to <strong>{email}</strong></p>

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="6-digit verification code" 
            className="input-field"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            maxLength={6}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
          />

          {error && <p className="error-text">{error}</p>}
          {success && <p style={{ color: 'var(--accent-color)', marginBottom: '24px' }}>{success}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ marginTop: '24px' }}>
          <button 
            onClick={handleResend} 
            disabled={loading || resendCooldown > 0}
            style={{ 
              background: 'none', border: 'none', color: resendCooldown > 0 ? 'var(--text-secondary)' : 'var(--accent-color)', 
              cursor: resendCooldown > 0 ? 'default' : 'pointer', fontSize: '0.9rem' 
            }}
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get a code? Resend"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default VerifyEmail;
