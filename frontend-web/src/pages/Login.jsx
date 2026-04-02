import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';

function Login({ onSwitch }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  const canSubmit = useMemo(() => {
    const hasIdentity = identifier.trim().length > 0;
    const hasPassword = password.length > 0;
    const hasCaptcha = Boolean(captchaToken) || show2FA;
    const hasTotp = !show2FA || /^\d{6}$/.test(totpCode.trim());
    return hasIdentity && hasPassword && hasCaptcha && hasTotp && !loading;
  }, [identifier, password, captchaToken, show2FA, totpCode, loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
        totp_code: totpCode.trim() || null,
        captcha_token: captchaToken,
      });

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      navigate('/');
    } catch (err) {
      const message = err?.message || 'Unable to login. Please try again.';
      if (message.toLowerCase().includes('2fa code required')) {
        setShow2FA(true);
        setError('2FA is enabled on your account. Enter the 6-digit code to continue.');
      } else {
        setError(message);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/google', {
        token: credentialResponse.credential,
      });
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      navigate('/');
    } catch (err) {
      setError(err?.message || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-page">
      <h1 className="gradient-text auth-title">Welcome Back</h1>
      <p className="auth-subtitle">Sign in to continue where you left off.</p>

      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="text"
          placeholder="Username or email"
          className="input-field"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError('');
          }}
          required
          disabled={loading || show2FA}
          autoComplete="username"
        />

        <div className="password-wrap">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            className="input-field"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            required
            disabled={loading || show2FA}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="icon-btn"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {show2FA && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <input
              type="text"
              placeholder="6-digit 2FA code"
              className="input-field"
              value={totpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTotpCode(value);
                if (error) setError('');
              }}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
              autoComplete="one-time-code"
            />
          </motion.div>
        )}

        <div className="auth-inline-row">
          <Link to="/forgot-password" className="text-link">
            Forgot password?
          </Link>
        </div>

        <div className="captcha-wrap">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
            onChange={(token) => {
              setCaptchaToken(token);
              if (error) setError('');
            }}
            theme="dark"
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {loading ? (
            'Processing...'
          ) : show2FA ? (
            <>
              <ShieldCheck size={18} /> Verify
            </>
          ) : (
            <>
              <LogIn size={18} /> Login
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span>OR</span>
        <div className="auth-divider-line" />
      </div>

      <div className="auth-oauth-wrap">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google login failed.')} theme="filled_blue" shape="pill" />
      </div>

      <p className="auth-footer-text">
        New to CS-STAR?{' '}
        <button type="button" onClick={onSwitch} className="inline-switch-btn" disabled={loading}>
          Create account
        </button>
      </p>
    </div>
  );
}

export default Login;