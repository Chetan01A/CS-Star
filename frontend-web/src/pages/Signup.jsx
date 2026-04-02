import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';

function getPasswordStrength(pass) {
  let score = 0;
  if (pass.length >= 8) score += 25;
  if (/[A-Z]/.test(pass)) score += 25;
  if (/[0-9]/.test(pass)) score += 25;
  if (/[^A-Za-z0-9]/.test(pass)) score += 25;
  return score;
}

function getStrengthLabel(score) {
  if (score < 50) return 'Weak';
  if (score < 100) return 'Medium';
  return 'Strong';
}

function Signup({ onSwitch }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabel = useMemo(() => getStrengthLabel(strength), [strength]);

  const canSubmit = useMemo(() => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    return trimmedUsername.length >= 3 && isEmailLike && password.length >= 8 && Boolean(captchaToken) && !loading;
  }, [username, email, password, captchaToken, loading]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/signup', {
        username: username.trim(),
        email: email.trim(),
        password,
        captcha_token: captchaToken,
      });

      localStorage.setItem('signup_email', email.trim());
      navigate('/verify-email');
    } catch (err) {
      setError(err?.message || 'Unable to create account. Please try again.');
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
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
      setError(err?.message || 'Google signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-page">
      <h1 className="gradient-text auth-title">Create Account</h1>
      <p className="auth-subtitle">Start your CS-STAR journey in less than a minute.</p>

      <form onSubmit={handleSignup} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          className="input-field"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (error) setError('');
          }}
          required
          minLength={3}
          disabled={loading}
          autoComplete="username"
        />

        <input
          type="email"
          placeholder="Email address"
          className="input-field"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          required
          disabled={loading}
          autoComplete="email"
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
            minLength={8}
            disabled={loading}
            autoComplete="new-password"
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

        {password && (
          <div className="password-strength-wrap">
            <div className="password-strength-track">
              <motion.div
                className="password-strength-fill"
                animate={{ width: `${strength}%` }}
                transition={{ duration: 0.25 }}
                style={{
                  background: strength < 50 ? 'var(--error-color)' : strength < 100 ? '#f59e0b' : 'var(--success-color)',
                }}
              />
            </div>
            <span className="password-strength-label">Strength: {strengthLabel}</span>
          </div>
        )}

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
            'Creating account...'
          ) : (
            <>
              <UserPlus size={18} /> Sign up
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
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google signup failed.')}
          theme="filled_blue"
          shape="pill"
          text="signup_with"
        />
      </div>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="inline-switch-btn" disabled={loading}>
          Log in
        </button>
      </p>
    </div>
  );
}

export default Signup;