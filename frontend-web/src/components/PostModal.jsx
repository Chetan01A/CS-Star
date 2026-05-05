import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Heart, MessageCircle, Send, X, MoreHorizontal, Link, AlertCircle, User, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { buildAssetUrl } from '../config';
import ReportModal from './ReportModal';
import EmojiPicker from './EmojiPicker';
import ShareModal from './ShareModal';

const PostModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isLiked, setIsLiked] = useState(!!post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [activeCommentMenu, setActiveCommentMenu] = useState(null); // comment.id
  const [showReport, setShowReport] = useState(false);
  const [reportTarget, setReportTarget] = useState('post');
  const [showShare, setShowShare] = useState(false);

  const optionsRef = useRef(null);
  const commentInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user for delete/report permissions
    api.get('/auth/me').then(u => setCurrentUser(u)).catch(console.error);

    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    api.get(`/post/comments/${post.post_id}`)
      .then(d => setComments(d.comments || []))
      .catch(console.error)
      .finally(() => setLoadingComments(false));
  }, [post.post_id]);

  useEffect(() => {
    if (!showOptions) return;
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  useEffect(() => {
    if (activeCommentMenu === null) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.comment-options-container')) {
        setActiveCommentMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [activeCommentMenu]);

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount(c => next ? c + 1 : c - 1);
    try {
      await api.post(`/post/${next ? 'like' : 'unlike'}?post_id=${post.post_id}`);
    } catch { 
      setIsLiked(!next); 
      setLikesCount(c => next ? c - 1 : c + 1); 
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      let url = `/post/comment?post_id=${post.post_id}&text=${encodeURIComponent(newComment)}`;
      if (replyTo) {
        url += `&parent_id=${replyTo.id}`;
      }
      await api.post(url);
      setNewComment('');
      setReplyTo(null);
      const d = await api.get(`/post/comments/${post.post_id}`);
      setComments(d.comments || []);
    } catch (err) { console.error(err); }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await api.delete(`/post/comment/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      setActiveCommentMenu(null);
    } catch (err) { console.error(err); }
  };

  const startReply = (comment) => {
    setReplyTo({ id: comment.id, username: comment.username });
    setNewComment(`@${comment.username} `);
    if (commentInputRef.current) commentInputRef.current.focus();
  };

  const copyPostLink = () => {
    const url = `${window.location.origin}/profile/${post.user_id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
      setShowOptions(false);
    });
  };

  const mediaUrl = buildAssetUrl(post.image_url || post.post_image_url);
  const isNarrow = window.innerWidth < 1000;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isNarrow ? '10px' : '40px', boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '1fr 420px',
          gridTemplateRows: isNarrow ? 'auto 1fr' : '1fr',
          width: '100%', maxWidth: '1240px',
          height: isNarrow ? 'auto' : '85vh',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '28px', overflow: 'hidden',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.8)',
        }}
      >
        {/* Media Section */}
        <div style={{ 
          background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          minHeight: isNarrow ? '300px' : 'auto', 
          borderRight: isNarrow ? 'none' : '1px solid rgba(255,255,255,0.05)',
          position: 'relative'
        }}>
          {post.media_type === 'video' ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              loop
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={post.caption || 'Post'}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Sidebar Section */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#0e0e0e', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div 
              onClick={() => { onClose(); navigate(`/profile/${post.user_id}`); }}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
              className="hover-opacity"
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'black', overflow: 'hidden' }}>
                {post.profile_pic ? <img src={buildAssetUrl(post.profile_pic)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (post.username || 'U')[0].toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, color: 'white', fontSize: '1.05rem' }}>@{post.username || 'user'}</span>
                {post.full_name && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{post.full_name}</span>}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }} ref={optionsRef}>
                <button 
                  onClick={() => setShowOptions(!showOptions)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}
                >
                  <MoreHorizontal size={20} />
                </button>
                
                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px', padding: '8px', minWidth: '180px', zIndex: 100,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                    >
                      <button onClick={() => { onClose(); navigate(`/profile/${post.user_id}`); }} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} className="menu-item-hover">
                        <User size={16} /> View Profile
                      </button>
                      <button onClick={copyPostLink} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }} className="menu-item-hover">
                        <Link size={16} /> Copy Link
                      </button>
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                      <button onClick={() => { setShowReport(true); setReportTarget('post'); setShowOptions(false); }} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ff4d67', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }} className="menu-item-hover">
                        <AlertCircle size={16} /> Report
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Comments/Content Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="custom-scrollbar">
            {/* Caption */}
            {post.caption && (
              <div style={{ marginBottom: '28px' }}>
                <p style={{ margin: 0, color: 'white', fontSize: '1rem', lineHeight: 1.6 }}>
                  <strong style={{ marginRight: '8px', fontWeight: 700 }}>@{post.username}</strong>
                  <span style={{ opacity: 0.9 }}>{post.caption}</span>
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>A FEW MOMENTS AGO</span>
              </div>
            )}

            {/* Interaction Stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px' }}>
              <button onClick={handleLike} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', color: isLiked ? '#ff4d67' : 'white' }}>
                <Heart size={22} fill={isLiked ? '#ff4d67' : 'none'} color={isLiked ? '#ff4d67' : 'white'} />
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{likesCount}</span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <MessageCircle size={22} />
                <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{comments.length}</span>
              </div>
              <button onClick={() => setShowShare(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'white', display: 'flex' }}>
                <Send size={22} />
              </button>
            </div>

            {/* Comment List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                   <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'white', borderRadius: '50%', margin: '0 auto 12px' }}></div>
                   <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fetching thoughts...</p>
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                  <MessageCircle size={32} style={{ opacity: 0.1, marginBottom: '12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Be the first to share a thought.</p>
                </div>
              ) : comments.map(c => (
                <div key={c.id} style={{ marginLeft: c.parent_id ? '24px' : 0, borderLeft: c.parent_id ? '2px solid rgba(255,255,255,0.06)' : 'none', paddingLeft: c.parent_id ? '16px' : 0, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55, flex: 1 }}>
                      <strong style={{ color: 'white', marginRight: '8px', fontWeight: 700 }}>{c.username}</strong>
                      <span style={{ color: 'rgba(255,255,255,0.85)' }}>{c.text}</span>
                    </p>
                    
                    {/* Comment Options Menu */}
                    <div className="comment-options-container" style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setActiveCommentMenu(activeCommentMenu === c.id ? null : c.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        className="hover-opacity"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      <AnimatePresence>
                        {activeCommentMenu === c.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 5 }}
                            style={{
                              position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '12px', padding: '6px', minWidth: '120px', zIndex: 110,
                              boxShadow: '0 10px 25px rgba(0,0,0,0.6)'
                            }}
                          >
                            {currentUser && currentUser.id === c.user_id ? (
                              <button onClick={() => deleteComment(c.id)} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ff4d67', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }} className="menu-item-hover">
                                <Trash2 size={14} /> Delete
                              </button>
                            ) : (
                              <button onClick={() => { setShowReport(true); setReportTarget('comment'); setActiveCommentMenu(null); }} style={{ width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', color: 'white', textAlign: 'left', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '10px' }} className="menu-item-hover">
                                <AlertCircle size={14} /> Report
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>1m</span>
                    <button 
                      onClick={() => startReply(c)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 700, padding: 0, cursor: 'pointer' }}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment Input Section */}
          <form onSubmit={handleComment} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#121212' }}>
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem' }}>
                <span>Replying to <strong>@{replyTo.username}</strong></span>
                <X size={14} className="cursor-pointer" onClick={() => { setReplyTo(null); setNewComment(''); }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <EmojiPicker onEmojiSelect={(emoji) => setNewComment(prev => prev + emoji)} />
              <input
                ref={commentInputRef}
                type="text" value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="input-field"
                style={{ flex: 1, fontSize: '0.95rem', padding: '12px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}
              />
              <button type="submit" disabled={!newComment.trim()} className="btn-primary" style={{ width: '44px', height: '44px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
      {showReport && (
        <ReportModal 
          targetType={reportTarget} 
          onClose={() => setShowReport(false)} 
        />
      )}
      {showShare && (
        <ShareModal post={post} onClose={() => setShowShare(false)} />
      )}
    </div>,
    document.body
  );
};

export default PostModal;
