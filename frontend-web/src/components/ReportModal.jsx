import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const REASONS = [
  "I just don't like it",
  "Bullying or unwanted contact",
  "Suicide, self-injury or eating disorders",
  "Nudity or sexual activity",
  "Hate speech or symbols",
  "Violence or exploitation",
  "Selling or promoting restricted items",
  "Scam, fraud or spam",
  "False information"
];

const ReportModal = ({ onClose, targetType = 'comment' }) => {
  const [step, setStep] = useState('list'); // 'list' or 'success'
  const [selectedReason, setSelectedReason] = useState('');

  const handleReport = (reason) => {
    setSelectedReason(reason);
    // In a real app, you'd send this to the backend:
    // api.post('/report', { type: targetType, reason })
    setStep('success');
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          background: '#1c1c1e', borderRadius: '20px',
          overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <X size={24} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>Report</span>
          <div style={{ width: '24px' }}></div> {/* Spacer */}
        </div>

        <div style={{ padding: '20px' }}>
          {step === 'list' ? (
            <>
              <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: 'white', fontWeight: 700 }}>
                Why are you reporting this {targetType}?
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {REASONS.map((reason, i) => (
                  <button
                    key={i}
                    onClick={() => handleReport(reason)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 0', background: 'transparent', border: 'none',
                      borderBottom: i === REASONS.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.9)', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.95rem'
                    }}
                    className="report-option-hover"
                  >
                    {reason}
                    <ChevronRight size={20} style={{ opacity: 0.3 }} />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ color: '#4BB543', marginBottom: '20px' }}
              >
                <CheckCircle size={64} style={{ margin: '0 auto' }} />
              </motion.div>
              <h3 style={{ color: 'white', margin: '0 0 12px' }}>Thanks for letting us know</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Your report has been submitted. We use these reports to help keep our community safe.
              </p>
              <button 
                onClick={onClose}
                className="btn-primary"
                style={{ marginTop: '30px', width: '100%', height: '48px', borderRadius: '12px' }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <style>{`
        .report-option-hover:hover {
          color: white !important;
        }
        .report-option-hover:hover svg {
          opacity: 1 !important;
          transform: translateX(4px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ReportModal;
