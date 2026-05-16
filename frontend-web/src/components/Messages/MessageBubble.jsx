import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, CornerUpLeft, Smile, Check, CheckCheck, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sameId } from './utils';
import { buildAssetUrl } from '../../config';

const MessageBubble = ({
  message: m,
  index,
  currUserId,
  activeUser,
  isMine,
  groupedWithPrevious,
  groupedWithNext,
  formatTime,
  theme,
  activeMenuId,
  setActiveMenuId,
  hoveredMessage,
  setHoveredMessage,
  handleCopy,
  setForwardingMessage,
  handleReport,
  handleDelete,
  setReplyingTo,
  handleReaction,
  handleRetryMessage,
  setSelectedMedia,
  messages,
  systemNotice,
}) => {
  const messageSpacing = groupedWithNext ? 4 : 14;
  const isSystemMessage = m.message_type === 'system';
  const isPostShare = m.message_type === 'post_share';
  const navigate = useNavigate();

  const getBubbleRadius = (isMine, groupedWithPrevious, groupedWithNext) => {
    if (isMine) {
      return `${groupedWithPrevious ? 14 : 22}px 22px ${groupedWithNext ? 14 : 22}px 22px`;
    }
    return `22px ${groupedWithPrevious ? 14 : 22}px 22px ${groupedWithNext ? 14 : 22}px`;
  };

  if (isSystemMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ alignSelf: 'center', marginBottom: messageSpacing, textAlign: 'center', maxWidth: 320 }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 18,
            background: theme.panelMid,
            border: `1px solid ${theme.borderSoft}`,
            color: theme.textSoft,
            fontSize: 14,
            lineHeight: 1.5,
            backdropFilter: 'blur(6px)',
          }}
        >
          {systemNotice?.text || m.text}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: theme.textMuted }}>
          {formatTime(m.time)}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      onMouseEnter={() => setHoveredMessage(index)} 
      onMouseLeave={() => setHoveredMessage(null)} 
      style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '72%', display: 'flex', flexDirection: 'column', position: 'relative', marginBottom: messageSpacing }}
    >
      {m.replied_to_id && (
        <div style={{ padding: '8px 12px', background: theme.panelSoft, borderRadius: '12px 12px 4px 4px', fontSize: 12, color: theme.textMuted, borderLeft: `3px solid ${theme.accent}`, marginBottom: -4, opacity: 0.8 }}>
          {messages.find(msg => msg.id === m.replied_to_id)?.text || "Original message deleted"}
        </div>
      )}
      
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          padding: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'voice' || m.message_type === 'post_share') ? '0' : '12px 18px',
          borderRadius: m.replied_to_id ? '4px 22px 22px 22px' : getBubbleRadius(isMine, groupedWithPrevious, groupedWithNext),
          background: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'post_share') ? 'none' : (m.message_type === 'voice' ? 'rgba(0,0,0,0.2)' : (isMine ? theme.accentGradient : theme.panelMid)),
          color: isMine ? theme.accentTextDark : theme.text, fontSize: 15, position: 'relative'
        }}>
          {m.message_type === 'image' && <img src={buildAssetUrl(m.media_url)} alt="media" onClick={() => setSelectedMedia({ url: buildAssetUrl(m.media_url), type: 'image' })} style={{ maxWidth: 320, maxHeight: 240, width: '100%', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
          {m.message_type === 'video' && <video src={buildAssetUrl(m.media_url)} controls={false} onClick={() => setSelectedMedia({ url: buildAssetUrl(m.media_url), type: 'video' })} style={{ maxWidth: 320, maxHeight: 240, width: '100%', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
          {m.message_type === 'voice' && <div style={{ padding: '8px 12px' }}><audio src={buildAssetUrl(m.media_url)} controls style={{ maxWidth: '100%', height: 32, filter: isMine ? 'invert(1) hue-rotate(180deg)' : 'none' }} /></div>}
          {m.message_type === 'sticker' && <img src={buildAssetUrl(m.media_url)} alt="sticker" style={{ width: 140, height: 140, objectFit: 'contain' }} />}
          {m.message_type === 'text' && m.text}
          {isPostShare && (() => {
            const rawText = m.text || '';
            const isVideo = m.media_url && /\.(mp4|webm|mov|avi|mkv)$/i.test(m.media_url);

            const handleCardClick = () => {
              // Extract the URL from text — works for both:
              //   old: "Check out this post: http://localhost:5173/post/5"
              //   new: "http://localhost:5173/reels?post=5"
              const urlMatch = rawText.match(/https?:\/\/[^\s]+/);
              if (!urlMatch) return;
              try {
                const parsed = new URL(urlMatch[0]);
                navigate(parsed.pathname + parsed.search);
              } catch {
                navigate(urlMatch[0]);
              }
            };

            return (
              <div
                onClick={handleCardClick}
                style={{
                  width: 260,
                  borderRadius: 18,
                  overflow: 'hidden',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  background: 'rgba(18,18,18,0.97)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.7)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
                }}
              >
                {/* Media Preview */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#000', overflow: 'hidden' }}>
                  {m.media_url ? (
                    isVideo ? (
                      <video
                        src={buildAssetUrl(m.media_url)}
                        muted playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={buildAssetUrl(m.media_url)}
                        alt="Shared post"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                      fontSize: 32,
                    }}>
                      {isVideo ? '🎬' : '📷'}
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)',
                  }} />

                  {/* Type badge — top right */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    borderRadius: 20, padding: '4px 10px',
                    fontSize: 11, fontWeight: 700, color: 'white',
                    display: 'flex', alignItems: 'center', gap: 4,
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}>
                    {isVideo ? (
                      <><Play size={10} fill="white" color="white" /> Reel</>
                    ) : (
                      <>📷 Post</>
                    )}
                  </div>

                  {/* Video play button — center */}
                  {isVideo && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Play size={20} fill="white" color="white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '12px 14px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: 12, fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {isVideo ? 'Watch this reel' : 'View post'}
                    </p>
                    <p style={{
                      margin: '2px 0 0', fontSize: 11,
                      color: 'rgba(255,255,255,0.4)',
                    }}>
                      Tap to open
                    </p>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Reactions Display */}
          {m.reactions && Object.keys(JSON.parse(m.reactions)).length > 0 && (
            <div style={{ position: 'absolute', top: '100%', [isMine ? 'right' : 'left']: 8, marginTop: -15, display: 'flex', gap: 2, zIndex: 60 }}>
              {Object.entries(JSON.parse(m.reactions)).map(([emoji, users]) => (
                <div key={emoji} style={{ background: theme.panelBgStrong, border: `1px solid ${theme.border}`, borderRadius: 10, padding: '2px 4px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                  <span>{emoji}</span><span style={{ color: theme.textMuted }}>{users.length}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Pill */}
        <AnimatePresence>
          {(hoveredMessage === index || activeMenuId?.id === m.id) && (
            <motion.div 
              initial={{ opacity: 0, x: isMine ? 10 : -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: isMine ? 10 : -10 }} 
              style={{ 
                position: 'absolute', 
                top: '50%', 
                transform: 'translateY(-50%)',
                [isMine ? 'right' : 'left']: 'calc(100% + 12px)', 
                background: theme.panelBgStrong, 
                border: `1px solid ${theme.border}`, 
                borderRadius: 30, 
                padding: '4px 10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12, 
                zIndex: 100, 
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)', 
                color: theme.textMuted 
              }}
            >
              <div style={{ position: 'relative', display: 'flex' }}>
                <MoreVertical size={14} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'more' ? null : { id: m.id, type: 'more' }); }} />
                {activeMenuId?.id === m.id && activeMenuId?.type === 'more' && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 12, background: theme.panelBgStrong, border: `1px solid ${theme.borderStrong}`, borderRadius: 12, overflow: 'hidden', zIndex: 150, minWidth: 140 }}>
                    <button onClick={() => handleCopy(m.text)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Copy</button>
                    <button onClick={() => setForwardingMessage(m)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: theme.text, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Forward</button>
                    {!isMine && <button onClick={() => handleReport(m.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: theme.warning, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Report</button>}
                    <button onClick={() => handleDelete(m.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: theme.dangerText, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Delete</button>
                  </div>
                )}
              </div>
              <CornerUpLeft size={14} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(m)} />
              <div style={{ position: 'relative', display: 'flex' }}>
                <Smile size={14} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' ? null : { id: m.id, type: 'emoji' }); }} />
                {activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 12, background: theme.panelBgStrong, borderRadius: 20, padding: '4px 8px', display: 'flex', gap: 6, zIndex: 150 }}>
                    {['❤️', '😂', '👍', '🔥', '😮', '😢'].map(emoji => <span key={emoji} style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => handleReaction(m.id, emoji)}>{emoji}</span>)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: isMine ? 'flex-end' : 'flex-start', marginTop: m.reactions ? 18 : 8 }}>
        <span style={{ fontSize: 10, color: theme.textMuted }}>{formatTime(m.time)}</span>
        {isMine && m.deliveryStatus === 'sending' && <span style={{ fontSize: 10, color: theme.textMuted }}>Sending...</span>}
        {isMine && (m.deliveryStatus === 'sent' || m.deliveryStatus === 'received') && <Check size={14} color={theme.textMuted} />}
        {isMine && m.deliveryStatus === 'read' && <CheckCheck size={14} color={theme.accent} />}
        {isMine && m.deliveryStatus === 'failed' && (
          <button type="button" onClick={() => handleRetryMessage(m.client_id)} style={{ background: 'none', border: 'none', color: theme.dangerText, cursor: 'pointer', fontSize: 10, padding: 0 }}>
            Retry
          </button>
        )}
        {isMine && !m.deliveryStatus && <CheckCheck size={14} color={m.is_read ? theme.accent : theme.textMuted} />}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
