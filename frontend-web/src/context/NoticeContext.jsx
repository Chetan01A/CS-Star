import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const NoticeContext = createContext(null);

export const useNotice = () => {
  const context = useContext(NoticeContext);
  if (!context) throw new Error('useNotice must be used within NoticeProvider');
  return context;
};

export const NoticeProvider = ({ children }) => {
  const [notices, setNotices] = useState([]);

  const showNotice = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now();
    setNotices(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotices(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  return (
    <NoticeContext.Provider value={{ showNotice }}>
      {children}
      <div className="notice-container">
        <AnimatePresence>
          {notices.map(notice => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`notice-item notice-${notice.type}`}
            >
              <div className="notice-icon">
                {notice.type === 'success' && <CheckCircle2 size={18} />}
                {notice.type === 'error' && <AlertCircle size={18} />}
                {notice.type === 'info' && <Info size={18} />}
              </div>
              <div className="notice-content">{notice.message}</div>
              <button 
                className="notice-close" 
                onClick={() => setNotices(prev => prev.filter(n => n.id !== notice.id))}
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NoticeContext.Provider>
  );
};
