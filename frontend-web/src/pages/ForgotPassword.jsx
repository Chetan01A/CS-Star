import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { Mail, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const resp = await api.post('/auth/forgot-password', { email });
      setMessage(resp.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card glass"
      >
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div className="icon-circle">
            <Mail size={32} color="var(--accent-color)" />
          </div>
        </div>
        
        <h2 className="gradient-text">Reset Password</h2>
        <p style={{ marginBottom: '32px', color: 'var(--text-secondary)' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        {!message ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p style={{ color: 'var(--accent-color)', marginBottom: '24px' }}>{message}</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Check your terminal logs for the mock email link in development!
            </p>
          </motion.div>
        )}

        <div style={{ marginTop: '24px' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
