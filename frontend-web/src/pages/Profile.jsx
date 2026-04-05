import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { api } from '../api';
import { Edit3, Grid, ShieldCheck, ShieldAlert, UserPlus, UserMinus, Clapperboard, Heart, MessageCircle, Send, X, MoreHorizontal, Pin, BarChart3, Trash2, EyeOff, Download, MessageSquareOff, Pencil, Bookmark, CircleHelp, Expand, ThumbsUp, ThumbsDown, SlidersHorizontal, Flag, PlaySquare, Camera, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'http://localhost:8000';

const formatCount = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

const renderProfileMedia = (item, mediaProps = {}, style = {}) => {
  const mediaUrl = `${API_BASE_URL}/${item.image_url}`;
  if (item.media_type === 'video') {
    return (
      <video
        src={mediaUrl}
        controls
        {...mediaProps}
        controlsList={item.downloads_enabled === false ? 'nodownload' : undefined}
        onContextMenu={item.downloads_enabled === false ? (e) => e.preventDefault() : undefined}
        style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000', ...style }}
      />
    );
  }

  return (
    <img
      src={mediaUrl}
      alt={item.caption || 'User post'}
      {...mediaProps}
      onContextMenu={item.downloads_enabled === false ? (e) => e.preventDefault() : undefined}
      style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  );
};

const MediaCard = ({ item, onOpen }) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={() => onOpen(item)}
      style={{
        aspectRatio: '1 / 1',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0',
        background: '#0b0d10',
        border: 'none',
        padding: 0,
        cursor: 'pointer'
      }}
    >
      {renderProfileMedia(item)}

      {item.media_type === 'video' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: 'white'
          }}
        >
          <PlaySquare size={18} fill="rgba(255,255,255,0.95)" strokeWidth={1.8} />
        </div>
      )}
    </motion.button>
  );
};

const ReelCard = ({ item, onOpen }) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={() => onOpen(item)}
      style={{
        position: 'relative',
        aspectRatio: '9 / 16',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '0',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        background: '#050505'
      }}
    >
      {renderProfileMedia(item)}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.18) 38%, rgba(0,0,0,0.82) 88%, rgba(0,0,0,0.96))'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 800,
          fontSize: '1rem'
        }}
      >
        <span>{item.username?.[0]?.toLowerCase() || 'm'}</span>
        <span style={{ color: '#e4d84c', fontSize: '0.9rem' }}>•</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: '10px',
          right: '10px',
          bottom: '10px',
          color: 'white',
          display: 'grid',
          gap: '6px',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, opacity: 0.9 }}>
          {item.username}
        </p>
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.25, textTransform: 'uppercase' }}>
          {item.caption || 'Watch this reel'}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, justifyContent: 'flex-start', fontSize: '0.95rem' }}>
          <Eye size={16} />
          <span>{item.likes_count || 0}</span>
        </div>
      </div>
    </motion.button>
  );
};

const ProfileReelsModal = ({ reels, selectedReelId, profile, isFollowing, onClose, onOpenProfile, onToggleFollow, onUpdatePost }) => {
  const [currentReelId, setCurrentReelId] = useState(selectedReelId);
  const [likedMap, setLikedMap] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [loadingCommentsMap, setLoadingCommentsMap] = useState({});
  const [newCommentMap, setNewCommentMap] = useState({});
  const commentsSectionRef = useRef(null);
  const commentInputRef = useRef(null);
  const lastScrollSwitchRef = useRef(0);
  const isNarrowViewport = typeof window !== 'undefined' && window.innerWidth < 960;

  useEffect(() => {
    setCurrentReelId(selectedReelId);
  }, [selectedReelId]);

  const currentIndex = Math.max(0, reels.findIndex((reel) => reel.post_id === currentReelId));
  const currentReel = reels[currentIndex] || reels[0];

  const fetchComments = async (postId) => {
    setLoadingCommentsMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await api.get(`/post/comments/${postId}`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommentsMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleLike = async (reel) => {
    const wasLiked = likedMap[reel.post_id] ?? !!reel.is_liked;
    const nextLiked = !wasLiked;

    setLikedMap((prev) => ({ ...prev, [reel.post_id]: nextLiked }));
    onUpdatePost(reel.post_id, {
      is_liked: nextLiked,
      likes_count: Math.max(0, (reel.likes_count || 0) + (nextLiked ? 1 : -1)),
    });

    try {
      if (nextLiked) {
        await api.post(`/post/like?post_id=${reel.post_id}`);
      } else {
        await api.post(`/post/unlike?post_id=${reel.post_id}`);
      }
    } catch (err) {
      console.error(err);
      setLikedMap((prev) => ({ ...prev, [reel.post_id]: wasLiked }));
      onUpdatePost(reel.post_id, {
        is_liked: wasLiked,
        likes_count: reel.likes_count || 0,
      });
    }
  };

  const handleToggleComments = async (postId) => {
    if (!commentsByPost[postId]) {
      await fetchComments(postId);
    }

    requestAnimationFrame(() => {
      commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      commentInputRef.current?.focus();
    });
  };

  const handleAddComment = async (event, reel) => {
    event.preventDefault();
    const text = (newCommentMap[reel.post_id] || '').trim();
    if (!text) return;

    try {
      await api.post(`/post/comment?post_id=${reel.post_id}&text=${encodeURIComponent(text)}`);
      setNewCommentMap((prev) => ({ ...prev, [reel.post_id]: '' }));
      onUpdatePost(reel.post_id, {
        comments_count: (reel.comments_count || 0) + 1,
      });
      await fetchComments(reel.post_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (reel) => {
    try {
      await api.post(`/post/share?post_id=${reel.post_id}`);
      const nextShareCount = (reel.share_count || 0) + 1;
      onUpdatePost(reel.post_id, { share_count: nextShareCount });
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${reel.user_id}`);
      alert('Reel link copied');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNextReel = async () => {
    if (!reels.length) return;
    const nextIndex = currentIndex === reels.length - 1 ? 0 : currentIndex + 1;
    const nextReel = reels[nextIndex];
    setCurrentReelId(nextReel.post_id);
    if (nextReel && !commentsByPost[nextReel.post_id]) {
      await fetchComments(nextReel.post_id);
    }
  };

  const handlePreviousReel = async () => {
    if (!reels.length) return;
    const previousIndex = currentIndex === 0 ? reels.length - 1 : currentIndex - 1;
    const previousReel = reels[previousIndex];
    setCurrentReelId(previousReel.post_id);
    if (previousReel && !commentsByPost[previousReel.post_id]) {
      await fetchComments(previousReel.post_id);
    }
  };

  const handleWheelNavigation = (event) => {
    if (reels.length <= 1) return;

    const now = Date.now();
    if (Math.abs(event.deltaY) < 30 || now - lastScrollSwitchRef.current < 450) {
      return;
    }

    lastScrollSwitchRef.current = now;

    if (event.deltaY > 0) {
      handleNextReel();
    } else {
      handlePreviousReel();
    }
  };

  useEffect(() => {
    if (currentReel && !commentsByPost[currentReel.post_id]) {
      fetchComments(currentReel.post_id);
    }
  }, [currentReel?.post_id]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          padding: isNarrowViewport ? '12px' : '24px',
          boxSizing: 'border-box',
          display: 'grid',
          placeItems: 'center',
          overflow: 'auto'
        }}
      >
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheelNavigation}
          style={{
            width: isNarrowViewport ? 'min(100%, 460px)' : 'min(1220px, calc(100vw - 64px), calc(100dvw - 64px))',
            height: isNarrowViewport ? 'min(100%, calc(100vh - 24px), calc(100dvh - 24px))' : 'min(900px, calc(100vh - 48px), calc(100dvh - 48px))',
            maxWidth: isNarrowViewport ? 'calc(100vw - 24px)' : 'calc(100vw - 64px)',
            maxHeight: isNarrowViewport ? 'calc(100vh - 24px)' : 'calc(100vh - 48px)',
            boxSizing: 'border-box',
            borderRadius: isNarrowViewport ? '12px' : '10px',
            overflow: 'hidden',
            background: '#121212',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'grid',
            gridTemplateColumns: isNarrowViewport ? '1fr' : 'minmax(520px, 1fr) 480px',
            gridTemplateRows: isNarrowViewport ? 'minmax(260px, 52vh) minmax(0, 1fr)' : '1fr',
            isolation: 'isolate',
            margin: 'auto'
          }}
        >
          <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, position: 'relative', padding: 0 }}>
            {currentReel && (
              <video
                key={currentReel.post_id}
                src={`${API_BASE_URL}/${currentReel.image_url}`}
                loop
                playsInline
                autoPlay
                muted
                controls={false}
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block',
                  background: '#000'
                }}
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: '#1c1c1e' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <button onClick={() => currentReel && onOpenProfile(currentReel.user_id)} style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                  {currentReel?.profile_pic ? (
                    <img src={`${API_BASE_URL}/${currentReel.profile_pic}`} alt={currentReel.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    currentReel?.username?.[0]?.toUpperCase() || '?'
                  )}
                </button>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => currentReel && onOpenProfile(currentReel.user_id)} style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: '1rem' }}>
                      {currentReel?.username || profile.username}
                    </button>
                    {!currentReel?.is_owner && (
                      <button onClick={onToggleFollow} style={{ background: 'transparent', border: 'none', color: '#5f7cff', cursor: 'pointer', padding: 0, fontWeight: 800, fontSize: '0.95rem' }}>
                        {isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: '0.84rem' }}>
                    {currentReel?.likes_count || 0}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                  <X size={22} />
                </button>
              </div>
            </div>
            {currentReel && (
              <>
                <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', gap: '18px', color: 'white' }}>
                  <button onClick={() => handleToggleLike(currentReel)} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: 0 }}>
                    <Heart size={24} fill={(likedMap[currentReel.post_id] ?? !!currentReel.is_liked) ? '#ff4d67' : 'none'} color={(likedMap[currentReel.post_id] ?? !!currentReel.is_liked) ? '#ff4d67' : 'white'} />
                  </button>
                  <button onClick={() => handleToggleComments(currentReel.post_id)} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: 0 }}>
                    <MessageCircle size={24} />
                  </button>
                  <button onClick={() => handleShare(currentReel)} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', padding: 0 }}>
                    <Send size={24} />
                  </button>
                  <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.72)', fontSize: '0.9rem', fontWeight: 700 }}>
                    Reel {currentIndex + 1} / {reels.length}
                  </div>
                </div>

                <div style={{ padding: '14px 18px 8px', color: 'white' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    Liked by <span style={{ opacity: 0.86 }}>{profile.username}</span> and others
                  </p>
                  <p style={{ margin: '8px 0 0', lineHeight: 1.55 }}>
                    <strong>{currentReel.username}</strong> <span style={{ opacity: 0.95 }}>{currentReel.caption || 'Watch this reel.'}</span>
                  </p>
                </div>

                <div ref={commentsSectionRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  {loadingCommentsMap[currentReel.post_id] ? (
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)' }}>Loading comments...</p>
                  ) : (commentsByPost[currentReel.post_id] || []).length === 0 ? (
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)' }}>No comments yet.</p>
                  ) : (
                    (commentsByPost[currentReel.post_id] || []).map((comment) => (
                      <p key={comment.id} style={{ margin: 0, color: 'white', lineHeight: 1.5, fontSize: '0.92rem' }}>
                        <strong>{comment.username}</strong> <span style={{ opacity: 0.88 }}>{comment.text}</span>
                      </p>
                    ))
                  )}
                </div>

                <form onSubmit={(event) => handleAddComment(event, currentReel)} style={{ display: 'flex', gap: '12px', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={newCommentMap[currentReel.post_id] || ''}
                    onChange={(event) => setNewCommentMap((prev) => ({ ...prev, [currentReel.post_id]: event.target.value }))}
                    placeholder="Add a comment..."
                    className="input-field"
                    style={{ fontSize: '0.92rem' }}
                  />
                  <button type="submit" className="btn-primary" style={{ borderRadius: '10px', padding: '0 18px' }}>
                    Post
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
    ,
    document.body
  );
};

const ProfilePostModal = ({ post, profile, onClose, onUpdatePost, onDeletePost, onRemoveFromGrid }) => {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [shareCount, setShareCount] = useState(post.share_count || 0);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(post.caption || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewerSheet, setViewerSheet] = useState(null);
  const [viewerMessage, setViewerMessage] = useState('');
  const [settings, setSettings] = useState({
    hide_like_count: !!post.hide_like_count,
    hide_share_count: !!post.hide_share_count,
    comments_enabled: post.comments_enabled !== false,
    downloads_enabled: post.downloads_enabled !== false,
    is_pinned: !!post.is_pinned,
    show_on_grid: post.show_on_grid !== false,
  });

  useEffect(() => {
    setShowComments(false);
    setReplyingTo(null);
    setNewComment('');
    setShowMenu(false);
    setIsEditing(false);
    setEditedCaption(post.caption || '');
    setIsLiked(post.is_liked);
    setLikesCount(post.likes_count);
    setCommentsCount(post.comments_count);
    setShareCount(post.share_count || 0);
    setSaved(false);
    setViewerSheet(null);
    setViewerMessage('');
    setSettings({
      hide_like_count: !!post.hide_like_count,
      hide_share_count: !!post.hide_share_count,
      comments_enabled: post.comments_enabled !== false,
      downloads_enabled: post.downloads_enabled !== false,
      is_pinned: !!post.is_pinned,
      show_on_grid: post.show_on_grid !== false,
    });
  }, [post]);

  const syncPost = (changes) => {
    onUpdatePost(post.post_id, changes);
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

  const handleLike = async () => {
    const nextLiked = !isLiked;
    const nextCount = nextLiked ? likesCount + 1 : likesCount - 1;

    setIsLiked(nextLiked);
    setLikesCount(nextCount);
    syncPost({ is_liked: nextLiked, likes_count: nextCount });

    try {
      if (nextLiked) {
        await api.post(`/post/like?post_id=${post.post_id}`);
      } else {
        await api.post(`/post/unlike?post_id=${post.post_id}`);
      }
    } catch (err) {
      console.error(err);
      setIsLiked(!nextLiked);
      setLikesCount(likesCount);
      syncPost({ is_liked: !nextLiked, likes_count: likesCount });
    }
  };

  const handleShare = async () => {
    try {
      const data = await api.post(`/post/share?post_id=${post.post_id}`);
      const nextShareCount = data.share_count ?? shareCount + 1;
      setShareCount(nextShareCount);
      syncPost({ share_count: nextShareCount });
      await navigator.clipboard.writeText(`${window.location.origin}/profile/${post.user_id}`);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      console.error(err);
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
      const nextCount = commentsCount + 1;
      setCommentsCount(nextCount);
      syncPost({ comments_count: nextCount });
      setNewComment('');
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = async () => {
    if (!settings.comments_enabled) return;
    const nextValue = !showComments;
    setShowComments(nextValue);

    if (nextValue && comments.length === 0) {
      fetchComments();
    }
  };

  const updateSettings = async (changes) => {
    const previousSettings = { ...settings };
    const nextSettings = { ...settings, ...changes };

    setSettings(nextSettings);
    syncPost(nextSettings);

    try {
      const data = await api.put(`/post/${post.post_id}/settings`, changes);
      const nextPost = data.post;
      setSettings({
        hide_like_count: !!nextPost.hide_like_count,
        hide_share_count: !!nextPost.hide_share_count,
        comments_enabled: nextPost.comments_enabled !== false,
        downloads_enabled: nextPost.downloads_enabled !== false,
        is_pinned: !!nextPost.is_pinned,
        show_on_grid: nextPost.show_on_grid !== false,
      });
      syncPost(nextPost);

      if (changes.show_on_grid === false) {
        onRemoveFromGrid(post.post_id);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setSettings(previousSettings);
      syncPost(previousSettings);
    } finally {
      setShowMenu(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const data = await api.put(`/post/${post.post_id}`, { caption: editedCaption });
      syncPost(data.post);
      setIsEditing(false);
      setShowMenu(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this post permanently?');
    if (!confirmed) return;

    try {
      await api.fetch(`/post/${post.post_id}`, { method: 'DELETE' });
      onDeletePost(post.post_id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewInsights = () => {
    alert(`Insights\nLikes: ${likesCount}\nComments: ${commentsCount}\nShares: ${shareCount}`);
    setShowMenu(false);
  };

  const handleViewerAction = async (action) => {
    setShowMenu(false);

    if (action === 'save') {
      setSaved((prev) => !prev);
      setViewerMessage(saved ? 'Removed from saved items.' : 'Saved to your collection.');
      return;
    }

    if (action === 'about') {
      setViewerSheet('about');
      return;
    }

    if (action === 'report') {
      setViewerSheet('report');
      return;
    }

    if (action === 'fullscreen') {
      const mediaElement = document.getElementById(`profile-media-${post.post_id}`);
      if (mediaElement?.requestFullscreen) {
        await mediaElement.requestFullscreen();
      }
      return;
    }

    if (action === 'why') {
      setViewerMessage('You are seeing this because you follow or visited this creator profile.');
      return;
    }

    if (action === 'interested') {
      setViewerMessage('We will show you more posts like this.');
      return;
    }

    if (action === 'not_interested') {
      setViewerMessage('We will reduce similar posts in your recommendations.');
      return;
    }

    if (action === 'preferences') {
      setViewerMessage('Content preference controls will be available here.');
    }
  };

  const menuItems = [
    {
      label: settings.hide_like_count ? 'Show like count to others' : 'Hide like count to others',
      icon: EyeOff,
      onClick: () => updateSettings({ hide_like_count: !settings.hide_like_count }),
    },
    {
      label: settings.hide_share_count ? 'Show share count' : 'Hide share count',
      icon: EyeOff,
      onClick: () => updateSettings({ hide_share_count: !settings.hide_share_count }),
    },
    {
      label: settings.comments_enabled ? 'Turn off commenting' : 'Turn on commenting',
      icon: MessageSquareOff,
      onClick: () => updateSettings({ comments_enabled: !settings.comments_enabled }),
    },
    {
      label: settings.downloads_enabled ? 'Turn off downloading' : 'Turn on downloading',
      icon: Download,
      onClick: () => updateSettings({ downloads_enabled: !settings.downloads_enabled }),
    },
    {
      label: isEditing ? 'Editing caption' : 'Edit',
      icon: Pencil,
      onClick: () => {
        setIsEditing(true);
        setShowMenu(false);
      },
    },
    {
      label: 'View insights',
      icon: BarChart3,
      onClick: handleViewInsights,
    },
    {
      label: settings.is_pinned ? 'Unpin from main grid' : 'Pin to your main grid',
      icon: Pin,
      onClick: () => updateSettings({ is_pinned: !settings.is_pinned }),
    },
    {
      label: 'Remove from main grid',
      icon: Grid,
      onClick: () => updateSettings({ show_on_grid: false }),
    },
    {
      label: 'Delete',
      icon: Trash2,
      onClick: handleDelete,
      danger: true,
    },
  ];

  const viewerPostMenuItems = [
    { label: saved ? 'Saved' : 'Save', icon: Bookmark, onClick: () => handleViewerAction('save') },
    { label: 'About this account', icon: CircleHelp, onClick: () => handleViewerAction('about') },
    { label: 'Report', icon: Flag, onClick: () => handleViewerAction('report'), danger: true },
  ];

  const viewerReelMenuItems = [
    { label: saved ? 'Saved' : 'Save', icon: Bookmark, onClick: () => handleViewerAction('save') },
    { label: 'View full screen', icon: Expand, onClick: () => handleViewerAction('fullscreen') },
    { label: 'Why you are seeing this post', icon: CircleHelp, onClick: () => handleViewerAction('why') },
    { label: 'Interested', icon: ThumbsUp, onClick: () => handleViewerAction('interested') },
    { label: 'Not interested', icon: ThumbsDown, onClick: () => handleViewerAction('not_interested') },
    { label: 'Report', icon: Flag, onClick: () => handleViewerAction('report'), danger: true },
    { label: 'Manage content preferences', icon: SlidersHorizontal, onClick: () => handleViewerAction('preferences') },
  ];

  const visibleMenuItems = post.is_owner
    ? menuItems
    : post.media_type === 'video'
      ? viewerReelMenuItems
      : viewerPostMenuItems;

  const reportOptions = [
    'I just do not like it',
    'Spam',
    'Nudity or sexual activity',
    'Hate speech or symbols',
    'Violence or dangerous organizations',
    'False information',
    'Bullying or harassment',
    'Scam or fraud',
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(10px)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="glass"
          style={{
            width: showComments ? 'min(1040px, 100%)' : 'min(700px, 100%)',
            maxHeight: '88vh',
            display: 'grid',
            gridTemplateColumns: showComments ? 'minmax(0, 1fr) 340px' : 'minmax(0, 1fr)',
            overflow: 'hidden',
            borderRadius: '28px',
            border: '1px solid var(--card-border)',
            transition: 'width 0.25s ease, grid-template-columns 0.25s ease'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--card-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.98rem' }}>{post.username}</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>@{post.username}</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowMenu((prev) => !prev)}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {showMenu && (
                    <div
                      className="glass"
                      style={{
                        position: 'absolute',
                        top: '28px',
                        right: 0,
                        width: '260px',
                        borderRadius: '16px',
                        border: '1px solid var(--card-border)',
                        padding: '8px',
                        zIndex: 5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      {visibleMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            onClick={item.onClick}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: item.danger ? '#ff6b6b' : 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              fontSize: '0.9rem'
                            }}
                          >
                            <Icon size={16} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '420px', maxHeight: '58vh', padding: '16px' }}>
              {renderProfileMedia(post, {
                id: `profile-media-${post.post_id}`,
              }, {
                objectFit: 'contain',
                maxHeight: '52vh',
                borderRadius: '18px',
                pointerEvents: 'auto',
              })}
            </div>

            <div style={{ padding: '16px 22px 0' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <textarea
                    value={editedCaption}
                    onChange={(e) => setEditedCaption(e.target.value)}
                    className="input-field"
                    style={{ minHeight: '90px', resize: 'none', fontSize: '0.94rem' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={() => { setIsEditing(false); setEditedCaption(post.caption || ''); }} className="glass" style={{ padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSaveEdit} className="btn-primary" disabled={saving} style={{ padding: '8px 14px', borderRadius: '10px' }}>{saving ? 'Saving...' : 'Save'}</button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: 'white', lineHeight: 1.55, fontSize: '0.95rem' }}>{post.caption || 'No caption'}</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '16px 22px 18px', borderTop: '1px solid var(--card-border)', marginTop: '16px' }}>
              <button onClick={handleLike} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}>
                <Heart size={20} fill={isLiked ? '#ff4d4d' : 'none'} color={isLiked ? '#ff4d4d' : 'white'} />
                <span>{post.show_like_count ? likesCount : 'Hidden'}</span>
              </button>
              <button onClick={toggleComments} disabled={!settings.comments_enabled} style={{ background: 'transparent', border: 'none', color: settings.comments_enabled ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: settings.comments_enabled ? 'pointer' : 'not-allowed', padding: 0 }}>
                <MessageCircle size={20} />
                <span>{commentsCount}</span>
              </button>
              <button onClick={handleShare} style={{ background: 'transparent', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}>
                <Send size={20} />
                <span>{post.show_share_count ? shareCount : 'Share'}</span>
              </button>
            </div>

            {viewerMessage && !post.is_owner && (
              <div style={{ padding: '0 22px 18px', color: 'var(--accent-color)', fontSize: '0.9rem' }}>
                {viewerMessage}
              </div>
            )}
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ x: 30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 30, opacity: 0 }}
                style={{
                  borderLeft: '1px solid var(--card-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 0,
                  background: 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--card-border)' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Comments</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{commentsCount} total</p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loadingComments ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No comments yet.</p>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          marginLeft: comment.parent_id ? '18px' : '0',
                          borderLeft: comment.parent_id ? '2px solid rgba(255,255,255,0.12)' : 'none',
                          paddingLeft: comment.parent_id ? '10px' : '0'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                          <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.92rem' }}>
                            <strong>{comment.username}</strong> <span style={{ opacity: 0.85 }}>{comment.text}</span>
                          </p>
                          {!comment.parent_id && (
                            <button
                              onClick={() => setReplyingTo({ id: comment.id, username: comment.username })}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}
                            >
                              Reply
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', padding: '16px 20px' }}>
                  {replyingTo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      <span>Replying to @{replyingTo.username}</span>
                      <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? 'Add a reply...' : 'Add a comment...'}
                      className="input-field"
                      disabled={!settings.comments_enabled}
                      style={{ fontSize: '0.9rem' }}
                    />
                    <button type="submit" className="btn-primary" disabled={!settings.comments_enabled} style={{ padding: '0 16px', borderRadius: '10px' }}>
                      {replyingTo ? 'Reply' : 'Post'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {viewerSheet === 'about' && !post.is_owner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="glass"
              style={{
                position: 'fixed',
                inset: 0,
                margin: 'auto',
                width: 'min(460px, calc(100vw - 32px))',
                height: 'fit-content',
                borderRadius: '26px',
                border: '1px solid var(--card-border)',
                padding: '28px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '26px' }}>
                <div style={{ width: '82px', height: '82px', borderRadius: '50%', overflow: 'hidden', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                  {profile?.profile_pic ? (
                    <img src={profile.profile_pic} alt={profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile?.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <h3 style={{ margin: '14px 0 6px' }}>{profile?.username}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>About this account</p>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Date joined</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Not shared publicly</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Account based in</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>Not shared publicly</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>Former usernames</p>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>No former usernames shown</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewerSheet === 'report' && !post.is_owner && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="glass"
              style={{
                position: 'fixed',
                inset: 0,
                margin: 'auto',
                width: 'min(520px, calc(100vw - 32px))',
                height: 'fit-content',
                maxHeight: '80vh',
                overflowY: 'auto',
                borderRadius: '26px',
                border: '1px solid var(--card-border)',
                padding: '24px'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Why are you reporting this post?</h3>
              <p style={{ marginTop: 0, marginBottom: '18px', color: 'var(--text-secondary)' }}>
                Your report is anonymous. Choose the reason that best matches this content.
              </p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {reportOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setViewerMessage(`Report submitted: ${option}`);
                      setViewerSheet(null);
                    }}
                    className="glass"
                    style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      borderRadius: '14px',
                      border: '1px solid var(--card-border)',
                      cursor: 'pointer',
                      color: 'white'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [mediaCounts, setMediaCounts] = useState({ posts: 0, videos: 0, images: 0 });
  const [mediaItems, setMediaItems] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedReelId, setSelectedReelId] = useState(null);
  
  // 2FA states
  const [show2FAPanel, setShow2FAPanel] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoHoverPosition, setPhotoHoverPosition] = useState({ x: 75, y: 75 });
  const [showEditProfilePanel, setShowEditProfilePanel] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  
  const navigate = useNavigate();

  const isMe = id === 'me';

  useEffect(() => {
    fetchProfile();
  }, [id]);

  useEffect(() => {
    setSelectedPost(null);
    setSelectedReelId(null);
  }, [id, activeTab]);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let profileData;
      if (isMe) {
        profileData = await api.get('/auth/me');
      } else {
        profileData = await api.get(`/profile/${id}`);
        // Also fetch follow status if not me
        const status = await api.get(`/follow/status/${id}`);
        setIsFollowing(status.is_following);
      }
      setProfile(profileData);

      // Fetch stats
      const targetId = isMe ? profileData.id : id;
      const [f1, f2] = await Promise.all([
        api.get(`/follow/followers-count/${targetId}`),
        api.get(`/follow/following-count/${targetId}`)
      ]);
      setStats({ followers: f1.count, following: f2.count });

      const mediaData = await api.get(`/post/user/${targetId}`);
      setMediaItems(mediaData.posts || []);
      setMediaCounts(mediaData.counts || { posts: 0, videos: 0, images: 0 });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter((item) => {
    if (activeTab === 'reels') return item.media_type === 'video';
    if (activeTab === 'posts') return item.media_type !== 'video';
    return false;
  });

  const handleOpenPost = (item) => {
    if (item.media_type === 'video') {
      setSelectedReelId(item.post_id);
      return;
    }

    setSelectedPost(item);
  };

  const handleUpdatePost = (postId, changes) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.post_id === postId ? { ...item, ...changes } : item))
    );

    setSelectedPost((prev) => {
      if (!prev || prev.post_id !== postId) return prev;
      return { ...prev, ...changes };
    });
  };

  const handleDeletePost = (postId) => {
    setMediaItems((prev) => {
      const deleted = prev.find((item) => item.post_id === postId);
      if (deleted) {
        const isVideo = deleted.media_type === 'video';
        setMediaCounts((counts) => ({
          posts: Math.max(0, counts.posts - 1),
          videos: Math.max(0, counts.videos - (isVideo ? 1 : 0)),
          images: Math.max(0, counts.images - (isVideo ? 0 : 1)),
        }));
      }
      return prev.filter((item) => item.post_id !== postId);
    });
  };

  const handleRemoveFromGrid = (postId) => {
    setMediaItems((prev) => {
      const removed = prev.find((item) => item.post_id === postId);
      if (removed) {
        const isVideo = removed.media_type === 'video';
        setMediaCounts((counts) => ({
          posts: Math.max(0, counts.posts - 1),
          videos: Math.max(0, counts.videos - (isVideo ? 1 : 0)),
          images: Math.max(0, counts.images - (isVideo ? 0 : 1)),
        }));
      }
      return prev.filter((item) => item.post_id !== postId);
    });
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.post('/follow/unfollow', { following_id: profile.id });
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await api.post('/follow/follow', { following_id: profile.id });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const setup2FA = async () => {
    try {
      const data = await api.post('/auth/2fa/setup', {});
      setTwoFactorData(data);
    } catch (err) {
      setTwoFactorError(err.message);
    }
  };

  const verify2FA = async () => {
    try {
      await api.post('/auth/2fa/verify', { code: twoFactorCode });
      setShow2FAPanel(false);
      fetchProfile();
      alert("2FA Enabled successfully!");
    } catch (err) {
      setTwoFactorError(err.message);
    }
  };

  const handleProfilePhotoUpload = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile || !profile) return;

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const data = await api.upload(`/profile/${profile.id}/photo`, formData);
      setProfile((prev) => ({ ...prev, profile_pic: data.profile_pic }));
      setShowPhotoPanel(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not upload profile photo');
    } finally {
      setPhotoUploading(false);
      event.target.value = '';
    }
  };

  const handleRemoveProfilePhoto = async () => {
    if (!profile) return;

    try {
      await api.fetch(`/profile/${profile.id}/photo`, { method: 'DELETE' });
      setProfile((prev) => ({ ...prev, profile_pic: '' }));
      setShowPhotoPanel(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not remove profile photo');
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setProfileSaving(true);
    try {
      const data = await api.put(`/profile/${profile.id}`, {
        username: editUsername,
        bio: editBio,
        profile_pic: profile.profile_pic || '',
      });
      setProfile((prev) => ({
        ...prev,
        ...(data.profile || {}),
      }));
      setShowEditProfilePanel(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Could not update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}><p>Loading profile...</p></div>;
  if (!profile) return <div style={{ padding: '100px', textAlign: 'center' }}><p>Profile not found.</p></div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '48px', marginBottom: '64px' }}>
        <div className={isMe ? 'profile-photo-trigger' : undefined} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative' }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={isMe ? () => setShowPhotoPanel(true) : undefined}
            onMouseMove={isMe ? (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPhotoHoverPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
              });
            } : undefined}
            style={{ 
              width: '150px', height: '150px', borderRadius: '50%', 
              background: 'var(--accent-gradient)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'white',
              boxShadow: '0 8px 32px rgba(0,242,254,0.2)',
              cursor: isMe ? 'pointer' : 'default',
            }}
          >
            {profile.profile_pic ? (
              <img src={`${API_BASE_URL}/${profile.profile_pic}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile.username[0].toUpperCase()
            )}
          </motion.div>

          {isMe && (
            <div
              className="profile-photo-hover-label"
              style={{
                opacity: 0,
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                fontWeight: 700,
                transition: 'opacity 0.18s ease',
                pointerEvents: 'none',
                position: 'absolute',
                left: `${photoHoverPosition.x}px`,
                top: `${photoHoverPosition.y}px`,
                transform: 'translate(-50%, -140%)',
                whiteSpace: 'nowrap',
                background: 'rgba(0, 0, 0, 0.78)',
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.12)',
                zIndex: 2
              }}
            >
              Change profile picture
            </div>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>{profile.username}</h1>
              <p style={{ color: 'white', fontWeight: '600', margin: '8px 0 0' }}>@{profile.username}</p>
            </div>

            {isMe ? (
              <button onClick={() => setShowEditProfilePanel(true)} className="glass" style={{ padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', gap: '8px', fontWeight: '600' }}>
                <Edit3 size={18} /> Edit Profile
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                className="btn-primary"
                style={{ 
                  padding: '8px 24px', 
                  borderRadius: '8px',
                  background: isFollowing ? 'transparent' : 'var(--accent-gradient)',
                  border: isFollowing ? '1px solid var(--card-border)' : 'none',
                  color: isFollowing ? 'var(--text-primary)' : 'black'
                }}
              >
                {isFollowing ? <><UserMinus size={18} /> Unfollow</> : <><UserPlus size={18} /> Follow</>}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '40px', marginBottom: '24px' }}>
            <div><span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{mediaCounts.posts}</span> <span style={{ color: 'var(--text-secondary)' }}>posts</span></div>
            <div><span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.followers}</span> <span style={{ color: 'var(--text-secondary)' }}>followers</span></div>
            <div><span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{stats.following}</span> <span style={{ color: 'var(--text-secondary)' }}>following</span></div>
          </div>

          <p style={{ margin: 0, lineHeight: '1.6' }}>{profile.bio || "No bio yet."}</p>
          
          {isMe && (
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              {profile.totp_enabled ? (
                <span className="glass" style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', border: '1px solid #10b981' }}>
                  <ShieldCheck size={16} /> 2FA Protected
                </span>
              ) : (
                <button 
                  onClick={() => { setShow2FAPanel(true); setup2FA(); }}
                  className="glass" style={{ padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', cursor: 'pointer' }}
                >
                  <ShieldAlert size={16} /> Enable 2FA
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showEditProfilePanel && isMe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEditProfilePanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(8px)',
              zIndex: 61,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass"
              style={{
                width: 'min(520px, 100%)',
                borderRadius: '28px',
                border: '1px solid var(--card-border)',
                padding: '28px'
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: '18px' }}>Edit Profile</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Username</p>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="input-field"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Bio</p>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="input-field"
                    placeholder="Write a short bio"
                    style={{ minHeight: '120px', resize: 'none' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '22px' }}>
                <button onClick={() => setShowEditProfilePanel(false)} className="glass" style={{ padding: '10px 16px', borderRadius: '12px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSaveProfile} className="btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPhotoPanel && isMe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPhotoPanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass"
              style={{
                width: 'min(560px, 100%)',
                borderRadius: '28px',
                overflow: 'hidden',
                border: '1px solid var(--card-border)',
                textAlign: 'center'
              }}
            >
              <div style={{ padding: '26px 24px 12px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2.2rem', fontWeight: 700 }}>
                  {profile.profile_pic ? (
                    <img src={`${API_BASE_URL}/${profile.profile_pic}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    profile.username[0].toUpperCase()
                  )}
                </div>
                <h3 style={{ margin: '0 0 8px' }}>Synced profile photo</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Choose a photo for your profile.</p>
              </div>

              <div style={{ borderTop: '1px solid var(--card-border)' }}>
                <label style={{ display: 'block', padding: '16px 20px', color: '#6d72ff', fontWeight: 700, cursor: photoUploading ? 'wait' : 'pointer', borderBottom: '1px solid var(--card-border)' }}>
                  {photoUploading ? 'Uploading Photo...' : 'Upload Photo'}
                  <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} style={{ display: 'none' }} disabled={photoUploading} />
                </label>
                <button style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', fontWeight: 600 }}>
                  Manage sync settings
                </button>
                <button onClick={handleRemoveProfilePhoto} style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', color: '#ff4d67', cursor: 'pointer', borderBottom: '1px solid var(--card-border)', fontWeight: 700 }}>
                  Remove Current Photo
                </button>
                <button onClick={() => setShowPhotoPanel(false)} style={{ width: '100%', padding: '16px 20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
        {show2FAPanel && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass"
            style={{ padding: '40px', borderRadius: '24px', marginBottom: '48px', border: '1px solid var(--accent-color)' }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Setup Two-Factor Authentication</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
              Add an extra layer of security to your account. Scan the QR code or enter the secret key into your authenticator app.
            </p>
            
            {twoFactorData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', alignItems: 'center' }}>
                  <div style={{ background: 'white', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ width: '150px', height: '150px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#333', fontSize: '0.8rem' }}>
                      [QR CODE PLACEHOLDER]<br/>{twoFactorData.secret}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Secret Key:</p>
                    <code style={{ display: 'block', background: 'rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', letterSpacing: '2px', fontSize: '1.1rem', color: 'var(--accent-color)' }}>{twoFactorData.secret}</code>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '32px' }}>
                  <p style={{ marginBottom: '16px', textAlign: 'center' }}>Enter the 6-digit verification code from your app:</p>
                  <div style={{ display: 'flex', gap: '16px', maxWidth: '360px', margin: '0 auto' }}>
                    <input 
                      type="text" 
                      placeholder="000 000" 
                      className="input-field"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      maxLength={6}
                      style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
                    />
                    <button onClick={verify2FA} className="btn-primary" style={{ padding: '0 32px' }}>Verify</button>
                  </div>
                  {twoFactorError && <p className="error-text" style={{ textAlign: 'center', marginTop: '16px' }}>{twoFactorError}</p>}
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center' }}>Initializing security module...</p>
            )}
            
            <button 
              onClick={() => setShow2FAPanel(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '32px', width: '100%', fontSize: '0.9rem' }}
            >
              Cancel Setup
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </AnimatePresence>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            alignItems: 'stretch',
            marginBottom: '24px'
          }}
        >
          {[
            { id: 'posts', icon: Grid, label: 'Posts' },
            { id: 'reels', icon: PlaySquare, label: 'Reels' },
            { id: 'saved', icon: Bookmark, label: 'Saved' },
            { id: 'tagged', icon: Camera, label: 'Tagged' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '56px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: isActive ? '1px solid rgba(255,255,255,0.95)' : '1px solid transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.58)',
                  cursor: 'pointer',
                  transition: 'color 0.18s ease, border-color 0.18s ease'
                }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              </button>
            );
          })}
        </div>

        {(activeTab === 'saved' || activeTab === 'tagged') ? (
          <div style={{ padding: '68px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', color: 'white' }}>
              {activeTab === 'saved' ? 'Saved posts will show here.' : 'Tagged posts will show here.'}
            </p>
            <p style={{ margin: 0 }}>
              {isMe ? 'This tab is ready for the next step.' : 'Nothing to show in this tab yet.'}
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '68px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 8px', fontSize: '1rem', color: 'white' }}>
              {isMe ? `Share your first ${activeTab === 'reels' ? 'reel' : 'post'}.` : `No ${activeTab === 'reels' ? 'reels' : 'posts'} yet.`}
            </p>
            <p style={{ margin: 0 }}>
              {formatCount(mediaCounts.posts, 'upload')} visible on this profile.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: activeTab === 'reels' ? '2px' : '2px',
              width: '100%'
            }}
          >
            {filteredItems.map((item) => (
              activeTab === 'reels' ? (
                <ReelCard key={item.post_id} item={item} onOpen={handleOpenPost} />
              ) : (
                <MediaCard key={item.post_id} item={item} onOpen={handleOpenPost} />
              )
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <ProfilePostModal
          post={selectedPost}
          profile={profile}
          onClose={() => setSelectedPost(null)}
          onUpdatePost={handleUpdatePost}
          onDeletePost={handleDeletePost}
          onRemoveFromGrid={handleRemoveFromGrid}
        />
      )}

      {selectedReelId && (
        <ProfileReelsModal
          reels={mediaItems.filter((item) => item.media_type === 'video')}
          selectedReelId={selectedReelId}
          profile={profile}
          isFollowing={isFollowing}
          onClose={() => setSelectedReelId(null)}
          onOpenProfile={(userId) => navigate(`/profile/${userId}`)}
          onToggleFollow={handleFollow}
          onUpdatePost={handleUpdatePost}
        />
      )}
    </div>
  );
}

export default Profile;
