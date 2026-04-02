import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Lock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const resp = await api.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setMessage(resp.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card glass">
          <h2 className="error-text">Invalid Reset Link</h2>
          <p>This link is missing a valid security token.</p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '24px' }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card glass"
      >
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div className="icon-circle">
            <Lock size={32} color="var(--accent-color)" />
          </div>
        </div>
        
        <h2 className="gradient-text">New Password</h2>
        <p style={{ marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Create a strong password for your CS-Star account.
        </p>

        {!message ? (
          <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="password" 
              placeholder="New Password" 
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <input 
              type="password" 
              placeholder="Confirm New Password" 
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--accent-color)', marginBottom: '24px' }}>{message}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Redirecting you to login...
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default ResetPassword;
