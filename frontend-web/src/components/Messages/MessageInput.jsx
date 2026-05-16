import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smile, Mic, ImageIcon, Send, X } from 'lucide-react';
import { sameId } from './utils';
import { EMOJI_CATEGORIES } from './constants';

const MessageInput = ({
  sendMessage,
  replyingTo,
  setReplyingTo,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiSearch,
  setEmojiSearch,
  newMessage,
  setNewMessage,
  handleTyping,
  toggleRecording,
  isRecording,
  fileInputRef,
  handleMediaUpload,
  theme,
  activeUser,
  currUserId,
}) => {
  const openMediaPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={sendMessage} style={{ padding: '16px 24px 24px', borderTop: `1px solid ${theme.borderSoft}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <AnimatePresence>
        {replyingTo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: theme.panelSoft, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${theme.accent}` }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: theme.accent }}>
                Replying to {sameId(replyingTo.from, currUserId) ? 'yourself' : activeUser.username}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {replyingTo.text}
              </p>
            </div>
            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(null)} />
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{ background: theme.panelSoft, borderRadius: 24, display: 'flex', alignItems: 'center', padding: '4px 8px', border: `1px solid ${theme.border}`, position: 'relative' }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ background: 'none', border: 'none', padding: 8, color: theme.textMuted, cursor: 'pointer' }}>
          <Smile size={24} />
        </button>
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 16, background: theme.panelBgStrong, borderRadius: 24, padding: 16, width: 320, zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
              <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Search emoji..." style={{ width: '100%', background: theme.panelSoft, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '8px 12px', color: theme.text, outline: 'none', marginBottom: 12 }} />
              <div className="chatScroll" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                  <div key={cat} style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>{cat}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                      {list.map(emoji => <span key={emoji} style={{ fontSize: 22, cursor: 'pointer' }} onClick={() => setNewMessage(p => p + emoji)}>{emoji}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input value={newMessage} onChange={handleTyping} placeholder="Message..." style={{ flex: 1, background: 'none', border: 'none', color: theme.text, padding: '12px 8px', outline: 'none' }} />
        <button type="button" onClick={toggleRecording} style={{ background: 'none', border: 'none', padding: 8, color: isRecording ? theme.danger : theme.textMuted, cursor: 'pointer' }}>
          <Mic size={22} />
        </button>
        <button type="button" onClick={openMediaPicker} aria-label="Attach photo or video" style={{ background: 'none', border: 'none', padding: 8, color: theme.textMuted, cursor: 'pointer' }}>
          <ImageIcon size={22} />
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleMediaUpload} />
        <button type="submit" style={{ background: 'none', border: 'none', padding: '8px 12px', color: theme.accent, cursor: 'pointer' }}>
          <Send size={24} />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
