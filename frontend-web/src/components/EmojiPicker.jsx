import React, { useState, useRef, useEffect } from 'react';
import { Smile, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_DATA = [
  // Faces & Emotions
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  // Hearts & Symbols
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', ' AB', ' CL', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '💡', '💢', '💣', '💤', '💥', '💦', '💨', '💫', '💬', '🗨️', '🗯️', '💭', '🕳️',
  // Gestures & People
  '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
  // Activities & Objects
  '✨', '🌟', '⭐', '💫', '🔥', '💥', '🌈', '☀️', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌊', '💧', '☔', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '🌋', '🌌', '🌃', '🌆', '🌅', '🌄', '🌇', '🌉', '♨️', '🎠', '🎡', '🎢', '🎪', '🎭', '🎨', '🧵', '🧶', '🎫', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎭', '🎨', '🖼️', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎸', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'
];

const EmojiPicker = ({ onEmojiSelect }) => {
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  const filteredEmojis = EMOJI_DATA.filter(e => !search || e.includes(search));

  return (
    <div style={{ position: 'relative' }} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{
          background: 'transparent', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center',
          transition: 'color 0.2s'
        }}
        className="hover-white"
      >
        <Smile size={22} />
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '12px',
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px', width: '280px', zIndex: 100,
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Search Bar */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Search size={14} style={{ opacity: 0.4 }} />
               <input 
                 type="text" 
                 placeholder="Search emojis..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 style={{ 
                   background: 'transparent', border: 'none', color: 'white', 
                   fontSize: '0.85rem', outline: 'none', width: '100%' 
                 }}
               />
            </div>

            {/* Emoji Grid */}
            <div 
              style={{ 
                padding: '12px', maxHeight: '240px', overflowY: 'auto',
                display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px'
              }}
              className="custom-scrollbar"
            >
              {filteredEmojis.length > 0 ? (
                filteredEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onEmojiSelect(emoji);
                      // Don't close if they want to add multiple? 
                      // Actually, users usually add one at a time. I'll keep it open.
                    }}
                    style={{
                      background: 'transparent', border: 'none', fontSize: '1.4rem',
                      cursor: 'pointer', padding: '4px', borderRadius: '8px',
                      transition: 'background 0.2s', display: 'flex', 
                      alignItems: 'center', justifyContent: 'center'
                    }}
                    className="emoji-hover"
                  >
                    {emoji}
                  </button>
                ))
              ) : (
                <div style={{ gridColumn: 'span 6', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  No emojis found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        .hover-white:hover { color: white !important; }
        .emoji-hover:hover { background: rgba(255,255,255,0.1); transform: scale(1.15); }
        .emoji-hover { transition: all 0.1s ease !important; }
      `}</style>
    </div>
  );
};

export default EmojiPicker;
