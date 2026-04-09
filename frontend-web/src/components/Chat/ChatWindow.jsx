import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, MoreHorizontal, MessageCircle, Send, Smile, Mic, Image as ImageIcon, X } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
  activeUser,
  currUserId,
  messages,
  newMessage,
  setNewMessage,
  handleTyping,
  sendMessage,
  onlineUsers,
  typingUsers,
  hoveredMessage,
  setHoveredMessage,
  activeMenuId,
  setActiveMenuId,
  replyingTo,
  setReplyingTo,
  forwardingMessage,
  setForwardingMessage,
  selectedMedia,
  setSelectedMedia,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiSearch,
  setEmojiSearch,
  isRecording,
  toggleRecording,
  fileInputRef,
  handleMediaUpload,
  messagesEndRef,
  startCall,
  callState,
  callError,
  renderAvatar,
  formatTime,
  shouldShowSeparator,
  formatChatSeparator,
  handleReaction,
  handleDelete,
  handleCopy,
  handleForward,
  handleReport,
  EMOJI_CATEGORIES,
  conversations
}) => {
  if (!activeUser) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px' }}>
        <MessageCircle size={96} style={{ color: '#38bdf8' }} />
        <h2 style={{ fontSize: 32 }}>Pick a chat</h2>
        <p style={{ color: '#94a3b8' }}>Select a contact from the left.</p>
      </div>
    );
  }

  return (
    <main style={{ borderLeft: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.96)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {renderAvatar(activeUser, 52)}
          <div>
            <h2 style={{ margin: 0, fontSize: 24 }}>{activeUser.username}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: onlineUsers.has(activeUser.id) ? '#34d399' : '#94a3b8' }}>
              {onlineUsers.has(activeUser.id) ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => startCall('audio')} disabled={callState !== 'idle'} style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: callState === 'idle' ? 'pointer' : 'not-allowed', opacity: callState === 'idle' ? 1 : 0.5 }}><Phone size={18} /></button>
          <button onClick={() => startCall('video')} disabled={callState !== 'idle'} style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: callState === 'idle' ? 'pointer' : 'not-allowed', opacity: callState === 'idle' ? 1 : 0.5 }}><Video size={18} /></button>
          <button style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer' }}><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {callError && (
        <div style={{ margin: '16px 26px 0', padding: '10px 14px', borderRadius: 14, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)', color: '#fecaca', fontSize: 13, zIndex: 10 }}>
          {callError}
        </div>
      )}

      {/* Messages List */}
      <div className="chatScroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 26px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <AnimatePresence>
          {messages.map((m, index) => {
            const previousMessage = messages[index - 1];
            const showSeparator = shouldShowSeparator(m, previousMessage);
            return (
              <React.Fragment key={m.id || index}>
                {showSeparator && (
                  <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'center', margin: '24px 0 16px' }}>
                    <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 12px', borderRadius: 999 }}>
                      {formatChatSeparator(m.time)}
                    </div>
                  </div>
                )}
                <MessageBubble
                  message={m}
                  isMine={m.from === currUserId}
                  currUserId={currUserId}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  hoveredMessage={hoveredMessage}
                  index={index}
                  setHoveredMessage={setHoveredMessage}
                  handleReaction={handleReaction}
                  handleDelete={handleDelete}
                  handleCopy={handleCopy}
                  setForwardingMessage={setForwardingMessage}
                  handleReport={handleReport}
                  setReplyingTo={setReplyingTo}
                  setSelectedMedia={setSelectedMedia}
                  formatTime={formatTime}
                  messages={messages}
                />
              </React.Fragment>
            );
          })}
        </AnimatePresence>
        
        {/* Typing Indicators */}
        <AnimatePresence>
          {Array.from(typingUsers).filter(id => id === activeUser.id).map(id => (
            <motion.div key={id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ alignSelf: 'flex-start', marginLeft: 8, marginBottom: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', padding: '8px 14px', borderRadius: '14px 14px 14px 4px', display: 'flex', gap: 4 }}>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite 0.2s' }}></span>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite 0.4s' }}></span>
                <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8', animation: 'typing 1.4s infinite 0.6s' }}></span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #34d399' }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#34d399' }}>Replying to {replyingTo.from === currUserId ? 'yourself' : activeUser.username}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyingTo.text}</p>
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setReplyingTo(null)} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 28, display: 'flex', alignItems: 'center', padding: '6px 12px', border: '1px solid rgba(148, 163, 184, 0.15)', position: 'relative' }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ background: 'none', border: 'none', padding: 10, color: showEmojiPicker ? '#34d399' : '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}><Smile size={24} /></button>
          
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 20, background: '#1e293b', borderRadius: 28, padding: 20, width: 340, zIndex: 100, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Search emoji..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '10px 16px', color: '#fff', outline: 'none', marginBottom: 16 }} />
                <div className="chatScroll" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => {
                    const filteredList = list.filter(e => e.includes(emojiSearch));
                    if (filteredList.length === 0) return null;
                    return (
                      <div key={cat} style={{ marginBottom: 20 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.05em' }}>{cat}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                          {filteredList.map(emoji => (
                            <span key={emoji} style={{ fontSize: 24, cursor: 'pointer', transition: 'transform 0.1s' }} onClick={() => setNewMessage(p => p + emoji)} onMouseEnter={e => e.target.style.transform = 'scale(1.2)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                              {emoji}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <input value={newMessage} onChange={handleTyping} placeholder="Type a message..." style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', padding: '12px 10px', outline: 'none', fontSize: 15 }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button type="button" onClick={toggleRecording} style={{ background: 'none', border: 'none', padding: 10, color: isRecording ? '#ef4444' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}><Mic size={22} /></button>
            <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', padding: 10, color: '#94a3b8', cursor: 'pointer', transition: 'color 0.2s' }}>
              <ImageIcon size={22} />
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleMediaUpload} />
            </button>
            <button type="submit" disabled={!newMessage.trim() && !isRecording} style={{ background: newMessage.trim() ? 'linear-gradient(135deg, #22c55e, #06b6d4)' : 'rgba(255,255,255,0.05)', border: 'none', width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', color: newMessage.trim() ? '#020617' : '#475569', cursor: newMessage.trim() ? 'pointer' : 'default', transition: 'all 0.3s', marginLeft: 8 }}>
              <Send size={20} style={{ transform: 'translateX(2px)' }} />
            </button>
          </div>
        </div>
      </form>

      {/* Forwarding Overlay */}
      <AnimatePresence>
        {forwardingMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(2, 7, 23, 0.85)', zIndex: 100, display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
            <div style={{ width: 'min(400px, 90vw)', background: '#0f172a', borderRadius: 32, padding: 24, display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 20 }}>Forward Message</h3>
                <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setForwardingMessage(null)} />
              </div>
              <div className="chatScroll" style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                {conversations.map(user => (
                  <button key={user.id} onClick={() => handleForward(user, forwardingMessage.text)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: 'none', color: '#e2e8f0', cursor: 'pointer', transition: 'background 0.2s', textAlign: 'left' }}>
                    {renderAvatar(user, 40)}
                    <span style={{ fontWeight: 600 }}>{user.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styles for typing animation */}
      <style>{`
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </main>
  );
};

export default ChatWindow;
