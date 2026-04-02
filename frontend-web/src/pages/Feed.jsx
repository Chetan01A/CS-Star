import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Heart, MessageCircle, Send, MoreHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SavePopover from '../components/SavePopover';

const API_BASE_URL = 'http://localhost:8000';

const toMediaUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `${API_BASE_URL}/${value}`;
};

const renderMedia = (post, style = {}, onVideoClick) => {
  const mediaUrl = `${API_BASE_URL}/${post.image_url}`;
  if (post.media_type === 'video') {
    return (
      <div
        onClick={onVideoClick}
        style={{ width: '100%', cursor: 'pointer', position: 'relative' }}
        title="Open in Reels"
      >
        <video
          src={mediaUrl}
          muted
          loop
          playsInline
          autoPlay
          style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', ...style }}
        />
      </div>
    );
  }

  return (
    <img
      src={mediaUrl}
      alt="Post content"
      style={{ width: '100%', maxHeight: '600px', objectFit: 'contain', ...style }}
    />
  );
};

const PostCard = ({ post, navigate }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, username }
  const [saveNotice, setSaveNotice] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;

    const handleOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showMenu]);

  const handleLike = async (e) => {
    e.stopPropagation();
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      if (isLiked) {
        await api.post(`/post/unlike?post_id=${post.post_id}`);
      } else {
        await api.post(`/post/like?post_id=${post.post_id}`);
      }
    } catch (err) {
      console.error(err);
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const toggleComments = async (e) => {
    if (e) e.stopPropagation();
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const data = await api.get(`/post/comments/${post.post_id}`);
      setComments(data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      let url = `/post/comment?post_id=${post.post_id}&text=${encodeURIComponent(newComment)}`;
      if (replyingTo) {
        url += `&parent_id=${replyingTo.id}`;
      }
      await api.post(url);
      setNewComment('');
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/profile/${post.user_id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      alert("Link copied to clipboard!");
    });
  };

  const handleSavedNotice = (message) => {
    setSaveNotice(message || 'Post was saved');
    setTimeout(() => setSaveNotice(''), 1800);
  };

  const handleOpenVideoInReels = (e) => {
    if (e) e.stopPropagation();
    navigate(`/reels?post=${post.post_id}`);
  };

  const handleMenuAction = (action, e) => {
    if (e) e.stopPropagation();
    setShowMenu(false);

    if (action === 'profile') {
      navigate(`/profile/${post.user_id}`);
      return;
    }

    if (action === 'copy_link') {
      const postUrl = `${window.location.origin}/profile/${post.user_id}`;
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Post link copied');
      });
      return;
    }

    if (action === 'open_reels') {
      navigate(`/reels?post=${post.post_id}`);
      return;
    }

    if (action === 'report') {
      alert('Thanks. We received your report.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass" 
      style={{ overflow: 'hidden', border: '1px solid var(--card-border)' }}
    >
      <div
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        onClick={() => navigate(`/profile/${post.user_id}`)}
        className="cursor-pointer"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              background: 'var(--accent-gradient)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'black',
              overflow: 'hidden'
            }}>
              {post.profile_pic ? (
                <img
                  src={toMediaUrl(post.profile_pic)}
                  alt={`${post.username || 'user'} profile`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                post.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
          <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{post.username}</span>
        </div>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            aria-label="Post options"
          >
            <MoreHorizontal size={20} color="var(--text-secondary)" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                onClick={(e) => e.stopPropagation()}
                className="glass"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  minWidth: '200px',
                  padding: '8px',
                  borderRadius: '12px',
                  zIndex: 20,
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <button type="button" onClick={(e) => handleMenuAction('profile', e)} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}>View profile</button>
                {post.media_type === 'video' && (
                  <button type="button" onClick={(e) => handleMenuAction('open_reels', e)} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}>Open in Reels</button>
                )}
                <button type="button" onClick={(e) => handleMenuAction('copy_link', e)} style={{ background: 'transparent', border: 'none', color: 'white', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}>Copy link</button>
                <button type="button" onClick={(e) => handleMenuAction('report', e)} style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer' }}>Report</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div style={{ background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {renderMedia(post, {}, handleOpenVideoInReels)}
      </div>
      
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
          <Heart 
            onClick={handleLike} 
            size={24}
            fill={isLiked ? "#ff4d4d" : "none"}
            color={isLiked ? "#ff4d4d" : "white"}
            style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }} 
            className="hover-scale"
          />
          <MessageCircle 
            onClick={toggleComments}
            size={24}
            style={{ cursor: 'pointer' }} 
            className="hover-scale" 
          />
          <Send 
            onClick={handleShare}
            size={24}
            style={{ cursor: 'pointer' }} 
            className="hover-scale" 
          />
          <SavePopover post={post} onSaved={handleSavedNotice} />
        </div>

        {saveNotice && (
          <p style={{ margin: '0 0 10px', color: 'var(--success-color)', fontSize: '0.86rem' }}>{saveNotice}</p>
        )}
        
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: '700', marginRight: '8px' }}>{likesCount} likes</span>
        </div>

        <p style={{ color: 'white', margin: 0, fontSize: '1.05rem', lineHeight: '1.5' }}>
          <strong style={{ opacity: 0.9 }}>{post.username}</strong> <span style={{ opacity: 0.8 }}>{post.caption}</span>
        </p>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {post.comments_count > 0 && (
            <span onClick={toggleComments} style={{ cursor: 'pointer', marginRight: '12px' }}>
              View all {post.comments_count} comments
            </span>
          )}
          A few moments ago
        </p>

        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginTop: '20px', borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}
            >
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingComments ? (
                  <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.5 }}>No comments yet.</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} style={{ 
                      fontSize: '0.95rem',
                      marginLeft: c.parent_id ? '32px' : '0',
                      borderLeft: c.parent_id ? '2px solid rgba(255,255,255,0.1)' : 'none',
                      paddingLeft: c.parent_id ? '12px' : '0'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ marginRight: '8px' }}>{c.username}</strong>
                          <span style={{ opacity: 0.8 }}>{c.text}</span>
                        </div>
                        {!c.parent_id && (
                          <button 
                            onClick={() => setReplyingTo({ id: c.id, username: c.username })}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-color)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Reply
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {replyingTo && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    padding: '4px 12px', 
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}>
                    <span>Replying to <strong>@{replyingTo.username}</strong></span>
                    <X size={14} className="cursor-pointer" onClick={() => setReplyingTo(null)} />
                  </div>
                )}
                
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" 
                    placeholder={replyingTo ? "Add a reply..." : "Add a comment..."} 
                    className="input-field"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '36px', borderRadius: '8px' }}>
                    {replyingTo ? 'Reply' : 'Post'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const data = await api.get('/post/feed');
      setFeed(data.feed || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 16px' }}>
      <header style={{ marginBottom: '48px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Your Feed</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Catch up with your favorite creators.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}><p>Synchronizing with the network...</p></div>
        ) : feed.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass" 
            style={{ padding: '64px', textAlign: 'center' }}
          >
            <p style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your universe is quiet.</p>
            <button className="btn-primary" onClick={() => navigate('/search')}>Explore Creators</button>
          </motion.div>
        ) : (
          feed.map((post) => (
            <PostCard key={post.post_id} post={post} navigate={navigate} />
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;
