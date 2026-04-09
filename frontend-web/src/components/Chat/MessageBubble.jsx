import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, CornerUpLeft, Smile, CheckCheck } from 'lucide-react';

const MessageBubble = ({ 
  message, 
  isMine, 
  currUserId, 
  activeMenuId, 
  setActiveMenuId, 
  hoveredMessage, 
  index, 
  setHoveredMessage,
  handleReaction,
  handleDelete,
  handleCopy,
  setForwardingMessage,
  handleReport,
  setReplyingTo,
  setSelectedMedia,
  formatTime,
  messages // needed to find replied message text
}) => {
  const m = message;
  const isSystem = m.message_type === 'system';
  
  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ alignSelf: 'center', maxWidth: '100%', marginBottom: 16 }}
      >
        <div style={{ 
          padding: '8px 14px', 
          borderRadius: 999, 
          background: 'rgba(148,163,184,0.12)', 
          border: '1px solid rgba(148,163,184,0.16)', 
          color: '#cbd5e1', 
          fontSize: 13, 
          textAlign: 'center' 
        }}>
          {m.text}
        </div>
      </motion.div>
    );
  }

  const reactions = m.reactions ? JSON.parse(m.reactions) : {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      onMouseEnter={() => setHoveredMessage(index)} 
      onMouseLeave={() => setHoveredMessage(null)} 
      style={{ 
        alignSelf: isMine ? 'flex-end' : 'flex-start', 
        maxWidth: '72%', 
        display: 'flex', 
        flexDirection: 'column', 
        position: 'relative',
        marginBottom: hasReactions ? 20 : 8 // Consistent spacing
      }}
    >
      {m.replied_to_id && (
        <div style={{ 
          padding: '8px 12px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '12px 12px 4px 4px', 
          fontSize: 12, 
          color: '#94a3b8', 
          borderLeft: '3px solid #34d399', 
          marginBottom: -4, 
          opacity: 0.8 
        }}>
          {messages.find(msg => msg.id === m.replied_to_id)?.text || "Original message deleted"}
        </div>
      )}
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'voice') ? '0' : '12px 18px',
          borderRadius: m.replied_to_id ? '4px 22px 22px 22px' : 22,
          background: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video') ? 'none' : (m.message_type === 'voice' ? 'rgba(0,0,0,0.2)' : (isMine ? 'linear-gradient(135deg, #22c55e, #06b6d4)' : 'rgba(255,255,255,0.08)')),
          color: isMine ? '#020617' : '#e2e8f0', 
          fontSize: 15, 
          position: 'relative',
          boxShadow: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video') ? 'none' : '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          {m.message_type === 'image' && <img src={m.media_url} alt="media" onClick={() => setSelectedMedia({ url: m.media_url, type: 'image' })} style={{ maxWidth: '100%', maxHeight: 240, width: 'auto', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
          {m.message_type === 'video' && <video src={m.media_url} controls={false} onClick={() => setSelectedMedia({ url: m.media_url, type: 'video' })} style={{ maxWidth: '100%', maxHeight: 240, width: 'auto', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
          {m.message_type === 'voice' && <div style={{ padding: '8px 12px' }}><audio src={m.media_url} controls style={{ maxWidth: '100%', height: 32, filter: isMine ? 'invert(1) hue-rotate(180deg)' : 'none' }} /></div>}
          {m.message_type === 'sticker' && <img src={m.media_url} alt="sticker" style={{ width: 140, height: 140, objectFit: 'contain' }} />}
          {m.message_type === 'text' && m.text}
          
          {/* Reactions Display (Stable Anchor) */}
          {hasReactions && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              [isMine ? 'right' : 'left']: 8, 
              marginTop: -10, 
              display: 'flex', 
              gap: 4, 
              zIndex: 10 
            }}>
              {Object.entries(reactions).map(([emoji, users]) => (
                <div key={emoji} style={{ 
                  background: '#1e293b', 
                  border: '1px solid rgba(148, 163, 184, 0.2)', 
                  borderRadius: 10, 
                  padding: '2px 6px', 
                  fontSize: 11, 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3, 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  color: '#fff'
                }}>
                  <span>{emoji}</span>
                  <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>{users.length}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Pill (Consistent Positioning) */}
        <AnimatePresence>
          {(hoveredMessage === index || activeMenuId?.id === m.id) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, x: isMine ? 10 : -10 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              exit={{ opacity: 0, scale: 0.9, x: isMine ? 10 : -10 }} 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                transform: 'translateY(-50%)',
                [isMine ? 'right' : 'left']: 'calc(100% + 12px)', 
                background: 'rgba(15, 23, 42, 0.95)', 
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 30, 
                padding: '6px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                zIndex: 100, 
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', 
                color: '#94a3b8' 
              }}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <MoreVertical 
                  size={16} 
                  style={{ cursor: 'pointer' }} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'more' ? null : { id: m.id, type: 'more' }); 
                  }} 
                />
                {activeMenuId?.id === m.id && activeMenuId?.type === 'more' && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    [isMine ? 'right' : 'left']: 0, 
                    marginBottom: 12, 
                    background: '#1e293b', 
                    border: '1px solid rgba(148, 163, 184, 0.2)', 
                    borderRadius: 14, 
                    overflow: 'hidden', 
                    zIndex: 150, 
                    minWidth: 150,
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                  }}>
                    <button onClick={() => handleCopy(m.text)} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13 }}>Copy</button>
                    <button onClick={() => setForwardingMessage(m)} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13 }}>Forward</button>
                    {!isMine && <button onClick={() => handleReport(m.id)} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13 }}>Report</button>}
                    <button onClick={() => handleDelete(m.id)} style={{ padding: '12px 18px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', width: '100%', textAlign: 'left', fontSize: 13 }}>Delete</button>
                  </div>
                )}
              </div>
              <CornerUpLeft size={16} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(m)} />
              <div style={{ position: 'relative', display: 'flex' }}>
                <Smile 
                  size={16} 
                  style={{ cursor: 'pointer' }} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' ? null : { id: m.id, type: 'emoji' }); 
                  }} 
                />
                {activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    [isMine ? 'right' : 'left']: 0, 
                    marginBottom: 12, 
                    background: '#1e293b', 
                    borderRadius: 24, 
                    padding: '6px 12px', 
                    display: 'flex', 
                    gap: 8, 
                    zIndex: 150,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {['❤️', '😂', '👍', '🔥', '😮', '😢'].map(emoji => (
                      <span key={emoji} style={{ cursor: 'pointer', fontSize: 20, transition: 'transform 0.1s' }} onClick={() => handleReaction(m.id, emoji)} onMouseEnter={e => e.target.style.transform = 'scale(1.3)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                        {emoji}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metadata (Time & Read Status) with consistent spacing */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6, 
        alignSelf: isMine ? 'flex-end' : 'flex-start', 
        marginTop: 6,
        minHeight: 14 // Prevent layout shift
      }}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{formatTime(m.time)}</span>
        {isMine && <CheckCheck size={14} color={m.is_read ? "#38bdf8" : "#64748b"} />}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
