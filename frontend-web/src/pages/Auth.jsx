import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Login from './Login';
import Signup from './Signup';

const flipVariants = {
  initial: (direction) => ({
    rotateY: direction > 0 ? 92 : -92,
    x: direction > 0 ? 12 : -12,
    opacity: 0.35,
    filter: 'brightness(0.78)',
  }),
  animate: {
    rotateY: 0,
    x: 0,
    opacity: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 0.72,
      ease: [0.24, 0.75, 0.24, 1],
    },
  },
  exit: (direction) => ({
    rotateY: direction > 0 ? -96 : 96,
    x: direction > 0 ? -10 : 10,
    opacity: 0.3,
    filter: 'brightness(0.72)',
    transition: {
      duration: 0.72,
      ease: [0.24, 0.75, 0.24, 1],
    },
  }),
};

function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(location.pathname === '/signup');
  const [isAnimating, setIsAnimating] = useState(false);
  const [flipDirection, setFlipDirection] = useState(1);

  useEffect(() => {
    setIsSignup(location.pathname === '/signup');
  }, [location.pathname]);

  const toggleFlip = () => {
    if (isAnimating) return;
    const nextIsSignup = !isSignup;
    setFlipDirection(nextIsSignup ? 1 : -1);
    setIsAnimating(true);
    setIsSignup(nextIsSignup);
    navigate(nextIsSignup ? '/signup' : '/login');
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="auth-container">
      <div className="auth-book">
        <div className="auth-brand-panel">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="auth-brand-content"
          >
            <div className="auth-badge">
              <Sparkles size={16} />
              <span>CS-STAR Identity</span>
            </div>
            <h1 className="gradient-text auth-brand-title">CS-STAR</h1>
            <p className="auth-brand-copy">
              Sign in to your universe. Secure authentication, smooth onboarding, and all your social activity in one place.
            </p>
            <div className="auth-brand-meta">
              <span>Trusted auth</span>
              <span>2FA ready</span>
              <span>Google sign-in</span>
            </div>
          </motion.div>
          <div className="auth-spine-shadow" />
        </div>

        <div className="auth-form-panel">
          <AnimatePresence mode="sync" custom={flipDirection} initial={false}>
            {!isSignup ? (
              <motion.div
                key="login"
                className="auth-form-frame"
                custom={flipDirection}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Login onSwitch={toggleFlip} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                className="auth-form-frame"
                custom={flipDirection}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Signup onSwitch={toggleFlip} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default Auth;
