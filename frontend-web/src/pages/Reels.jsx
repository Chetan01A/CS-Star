import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Heart, MessageCircle, Send, MoreHorizontal, Volume2, VolumeX, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isItemSaved, saveItemToCollection } from '../utils/saved';
import SavePopover from '../components/SavePopover';
import { buildAssetUrl } from '../config';

const toMediaUrl = (value) => {
  return buildAssetUrl(value);
};

function Reels() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [following, setFollowing] = useState({});
  const [followLoading, setFollowLoading] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);
  const [commentsOpenPostId, setCommentsOpenPostId] = useState(null);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [newCommentByPost, setNewCommentByPost] = useState({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState({});
  const [menuPostId, setMenuPostId] = useState(null);
  const [pausedByPost, setPausedByPost] = useState({});
  const [commentsDrawerTop, setCommentsDrawerTop] = useState(null);
  const [commentsDrawerLeft, setCommentsDrawerLeft] = useState(null);
  const [commentsArrowY, setCommentsArrowY] = useState(220);
  const [menuPanelTop, setMenuPanelTop] = useState(null);
  const [menuPanelLeft, setMenuPanelLeft] = useState(null);
  const [saveNotice, setSaveNotice] = useState('');
  const videoRefs = useRef({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPostId = Number(searchParams.get('post'));

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const [data, me] = await Promise.all([
        api.get('/post/explore'),
        api.get('/auth/me'),
      ]);
      const onlyVideos = (data.explore || []).filter((post) => post.media_type === 'video');
      setReels(onlyVideos);
      setSaved(() => {
        const next = {};
        onlyVideos.forEach((post) => {
          next[post.post_id] = isItemSaved(post.post_id);
        });
        return next;
      });
      setCurrentUserId(me?.id ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const orderedReels = useMemo(() => {
    if (!selectedPostId) return reels;
    const selected = reels.find((post) => Number(post.post_id) === selectedPostId);
    if (!selected) return reels;
    return [selected, ...reels.filter((post) => Number(post.post_id) !== selectedPostId)];
  }, [reels, selectedPostId]);

  useEffect(() => {
    if (!orderedReels.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const postId = Number(video.dataset.postId);
          if (entry.isIntersecting && entry.intersectionRatio > 0.7) {
            video.play().catch(() => {});
            if (postId) {
              setPausedByPost((prev) => ({ ...prev, [postId]: false }));
            }
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.3, 0.7, 0.9] }
    );

    orderedReels.forEach((post) => {
      const video = videoRefs.current[post.post_id];
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [orderedReels]);

  useEffect(() => {
    Object.values(videoRefs.current).forEach((video) => {
      if (!video) return;
      video.volume = volume;
      video.muted = muted;
    });
  }, [volume, muted]);

  useEffect(() => {
    if (!orderedReels.length || currentUserId == null) return;

    const uniqueUserIds = [...new Set(orderedReels.map((post) => post.user_id).filter((id) => id && id !== currentUserId))];
    const pendingIds = uniqueUserIds.filter((id) => following[id] === undefined);
    if (!pendingIds.length) return;

    Promise.all(
      pendingIds.map(async (userId) => {
        try {
          const status = await api.get(`/follow/status/${userId}`);
          return { userId, isFollowing: !!status.is_following };
        } catch (err) {
          console.error(err);
          return { userId, isFollowing: false };
        }
      })
    ).then((results) => {
      setFollowing((prev) => {
        const next = { ...prev };
        results.forEach(({ userId, isFollowing }) => {
          next[userId] = isFollowing;
        });
        return next;
      });
    });
  }, [orderedReels, currentUserId, following]);

  const handleToggleLike = async (post) => {
    const key = post.post_id;
    const wasLiked = liked[key] ?? !!post.is_liked;
    setLiked((prev) => ({ ...prev, [key]: !wasLiked }));

    try {
      if (wasLiked) {
        await api.post(`/post/unlike?post_id=${post.post_id}`);
      } else {
        await api.post(`/post/like?post_id=${post.post_id}`);
      }
    } catch (err) {
      console.error(err);
      setLiked((prev) => ({ ...prev, [key]: wasLiked }));
    }
  };

  const handleToggleFollow = async (post) => {
    if (!post?.user_id || post.user_id === currentUserId) return;
    const userId = post.user_id;
    if (followLoading[userId]) return;

    const wasFollowing = !!following[userId];
    setFollowLoading((prev) => ({ ...prev, [userId]: true }));
    setFollowing((prev) => ({ ...prev, [userId]: !wasFollowing }));

    try {
      if (wasFollowing) {
        await api.post('/follow/unfollow', { following_id: userId });
      } else {
        await api.post('/follow/follow', { following_id: userId });
      }
    } catch (err) {
      console.error(err);
      setFollowing((prev) => ({ ...prev, [userId]: wasFollowing }));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const fetchComments = async (postId) => {
    setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await api.get(`/post/comments/${postId}`);
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments || [] }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleToggleComments = async (post, event) => {
    if (commentsOpenPostId === post.post_id) {
      setCommentsOpenPostId(null);
      return;
    }
    setMenuPostId(null);

    if (typeof window !== 'undefined' && window.innerWidth > 900 && event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const frameRect = event.currentTarget.closest('.reel-frame')?.getBoundingClientRect();
      const anchorY = rect.top + rect.height / 2;
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      const estimatedDrawerH = Math.min(viewportH * 0.82, 760);
      const estimatedDrawerW = Math.min(390, viewportW - 26);
      const margin = 12;
      const top = Math.min(
        Math.max(margin, anchorY - estimatedDrawerH * 0.56),
        viewportH - estimatedDrawerH - margin
      );
      const preferredLeft = frameRect ? frameRect.right + 12 : viewportW - estimatedDrawerW - 10;
      const left = Math.min(
        Math.max(margin, preferredLeft),
        viewportW - estimatedDrawerW - margin
      );
      const arrowY = Math.min(Math.max(36, anchorY - top), estimatedDrawerH - 36);
      setCommentsDrawerTop(top);
      setCommentsDrawerLeft(left);
      setCommentsArrowY(arrowY);
    } else {
      setCommentsDrawerTop(null);
      setCommentsDrawerLeft(null);
      setCommentsArrowY(220);
    }

    setCommentsOpenPostId(post.post_id);
    if (!commentsByPost[post.post_id]) {
      await fetchComments(post.post_id);
    }
  };

  const handleAddComment = async (e, post) => {
    e.preventDefault();
    const text = (newCommentByPost[post.post_id] || '').trim();
    if (!text) return;

    try {
      await api.post(`/post/comment?post_id=${post.post_id}&text=${encodeURIComponent(text)}`);
      setNewCommentByPost((prev) => ({ ...prev, [post.post_id]: '' }));
      await fetchComments(post.post_id);
      setReels((prev) =>
        prev.map((item) =>
          item.post_id === post.post_id
            ? { ...item, comments_count: (item.comments_count || 0) + 1 }
            : item
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (post) => {
    const postUrl = `${window.location.origin}/reels?post=${post.post_id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Reel link copied');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavedNotice = (message, postId, isNowSaved = true) => {
    if (postId) {
      setSaved((prev) => ({ ...prev, [postId]: isNowSaved }));
    }
    setSaveNotice(message || 'Post was saved');
    setTimeout(() => setSaveNotice(''), 1800);
  };

  const handleReelsScroll = () => {
    if (commentsOpenPostId !== null) {
      setCommentsOpenPostId(null);
      setCommentsDrawerTop(null);
      setCommentsDrawerLeft(null);
    }
    if (menuPostId !== null) {
      setMenuPostId(null);
      setMenuPanelTop(null);
      setMenuPanelLeft(null);
    }
  };

  const handleTogglePlayback = (postId) => {
    const video = videoRefs.current[postId];
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setPausedByPost((prev) => ({ ...prev, [postId]: false }));
      return;
    }

    video.pause();
    setPausedByPost((prev) => ({ ...prev, [postId]: true }));
  };

  const activeCommentsPost = commentsOpenPostId
    ? orderedReels.find((item) => item.post_id === commentsOpenPostId)
    : null;
  const activeMenuPost = menuPostId
    ? orderedReels.find((item) => item.post_id === menuPostId)
    : null;

  if (loading) {
    return (
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 16px', textAlign: 'center' }}>
        <p>Loading reels...</p>
      </div>
    );
  }

  return (
    <div className="reels-page">
      {orderedReels.length === 0 ? (
        <div className="glass" style={{ padding: '48px', textAlign: 'center', maxWidth: '560px', margin: '56px auto 0' }}>
          <p>No reels yet.</p>
        </div>
      ) : (
        <div className="reels-scroll" onScroll={handleReelsScroll}>
          {orderedReels.map((post, index) => {
            const isLiked = liked[post.post_id] ?? !!post.is_liked;
            const likesCount = Math.max(0, (post.likes_count || 0) + (isLiked && !post.is_liked ? 1 : !isLiked && post.is_liked ? -1 : 0));
            const isFollowing = !!following[post.user_id];
            const isOwnReel = post.user_id === currentUserId;
            const isSaved = !!saved[post.post_id];
            const isPaused = !!pausedByPost[post.post_id];

            return (
              <motion.section
                key={post.post_id}
                className="reel-slide"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.15) }}
              >
                <div className="reel-frame">
                  <video
                    ref={(el) => {
                      videoRefs.current[post.post_id] = el;
                    }}
                    data-post-id={post.post_id}
                    src={`${API_BASE_URL}/${post.image_url}`}
                    loop
                    playsInline
                    muted={muted}
                    autoPlay={index === 0}
                    controls={false}
                    className="reel-video"
                    onClick={() => handleTogglePlayback(post.post_id)}
                  />

                  {isPaused && (
                    <button
                      type="button"
                      className="reel-play-overlay"
                      onClick={() => handleTogglePlayback(post.post_id)}
                      aria-label="Play reel"
                    >
                      <Play size={28} />
                    </button>
                  )}

                  <div className="reel-gradient" />

                  <div className="reel-volume-control">
                    <button
                      type="button"
                      className="reel-muted-toggle"
                      onClick={() => setMuted((prev) => !prev)}
                      aria-label={muted ? 'Unmute reel' : 'Mute reel'}
                    >
                      {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(volume * 100)}
                      className="reel-volume-slider"
                      onChange={(e) => {
                        const next = Number(e.target.value) / 100;
                        setVolume(next);
                        setMuted(next === 0);
                      }}
                      aria-label="Reel volume"
                    />
                  </div>

                  <div className="reel-overlay">
                    <div className="reel-user-row">
                      <button type="button" className="reel-avatar-btn" onClick={() => navigate(`/profile/${post.user_id || 'me'}`)}>
                        {post.profile_pic ? (
                          <img
                            src={toMediaUrl(post.profile_pic)}
                            alt={`${post.username || 'creator'} profile`}
                            className="reel-avatar-img"
                          />
                        ) : (
                          (post.username || 'C').charAt(0).toUpperCase()
                        )}
                      </button>
                      <button type="button" className="reel-username-btn" onClick={() => navigate(`/profile/${post.user_id || 'me'}`)}>
                        {post.username || 'creator'}
                      </button>
                      {!isOwnReel && (
                        <button
                          type="button"
                          className="reel-follow-btn"
                          onClick={() => handleToggleFollow(post)}
                          disabled={!!followLoading[post.user_id]}
                        >
                          {followLoading[post.user_id] ? '...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>

                    <p className="reel-caption">{post.caption || 'Watch this reel.'}</p>
                  </div>

                  <div className="reel-actions">
                    <button type="button" className="reel-action-btn" onClick={() => handleToggleLike(post)}>
                      <Heart size={27} fill={isLiked ? '#ff4d67' : 'none'} color={isLiked ? '#ff4d67' : 'white'} />
                      <span>{likesCount >= 1000 ? `${(likesCount / 1000).toFixed(1)}K` : likesCount}</span>
                    </button>
                    <button type="button" className="reel-action-btn" onClick={(e) => handleToggleComments(post, e)}>
                      <MessageCircle size={27} />
                      <span>{post.comments_count || 0}</span>
                    </button>
                    <button type="button" className="reel-action-btn" onClick={() => handleShare(post)}>
                      <Send size={27} />
                    </button>
                    <div className="reel-action-btn">
                      <SavePopover post={post} onSaved={(msg, isNowSaved) => handleSavedNotice(msg, post.post_id, isNowSaved)} />
                      <span>{isSaved ? 'Saved' : ''}</span>
                    </div>
                    <button
                      type="button"
                      className="reel-action-btn"
                      onClick={(e) => {
                        setCommentsOpenPostId(null);
                        setCommentsDrawerTop(null);
                        setCommentsDrawerLeft(null);
                        if (typeof window !== 'undefined' && window.innerWidth > 900 && e?.currentTarget) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const frameRect = e.currentTarget.closest('.reel-frame')?.getBoundingClientRect();
                          const viewportH = window.innerHeight;
                          const viewportW = window.innerWidth;
                          const menuW = Math.min(260, viewportW - 28);
                          const menuH = 182;
                          const margin = 12;
                          const preferredLeft = frameRect ? frameRect.right + 12 : viewportW - menuW - margin;
                          const left = Math.min(Math.max(margin, preferredLeft), viewportW - menuW - margin);
                          const top = Math.min(Math.max(margin, rect.top - 76), viewportH - menuH - margin);
                          setMenuPanelLeft(left);
                          setMenuPanelTop(top);
                        } else {
                          setMenuPanelLeft(null);
                          setMenuPanelTop(null);
                        }
                        setMenuPostId((prev) => (prev === post.post_id ? null : post.post_id));
                      }}
                    >
                      <MoreHorizontal size={27} />
                    </button>
                  </div>

                </div>
              </motion.section>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {activeCommentsPost && (
          <motion.div
            className="reel-comments-overlay"
            onClick={() => { setCommentsOpenPostId(null); setCommentsDrawerTop(null); }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="reel-comments-drawer"
              style={{
                top: commentsDrawerTop != null ? `${commentsDrawerTop}px` : undefined,
                left: commentsDrawerLeft != null ? `${commentsDrawerLeft}px` : undefined,
                '--comment-arrow-y': `${commentsArrowY}px`,
              }}
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="reel-comments-content">
                <div className="reel-comments-header">
                  <button type="button" onClick={() => setCommentsOpenPostId(null)} aria-label="Close comments">
                    <X size={20} />
                  </button>
                  <h4>Comments</h4>
                </div>

                <div className="reel-comments-list">
                  {loadingCommentsByPost[activeCommentsPost.post_id] ? (
                    <p>Loading comments...</p>
                  ) : (commentsByPost[activeCommentsPost.post_id] || []).length === 0 ? (
                    <p>No comments yet.</p>
                  ) : (
                    (commentsByPost[activeCommentsPost.post_id] || []).map((comment) => (
                      <div key={comment.id} className="reel-comment-item">
                        <strong>{comment.username}</strong> <span>{comment.text}</span>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={(e) => handleAddComment(e, activeCommentsPost)} className="reel-comment-form">
                  <input
                    type="text"
                    value={newCommentByPost[activeCommentsPost.post_id] || ''}
                    onChange={(e) =>
                      setNewCommentByPost((prev) => ({
                        ...prev,
                        [activeCommentsPost.post_id]: e.target.value,
                      }))
                    }
                    placeholder="Add a comment..."
                  />
                  <button type="submit">Post</button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeMenuPost && (
        <div
          className="reel-options-overlay"
          onClick={() => {
            setMenuPostId(null);
            setMenuPanelTop(null);
            setMenuPanelLeft(null);
          }}
        >
          <div
            className="reel-options-panel"
            style={{
              top: menuPanelTop != null ? `${menuPanelTop}px` : undefined,
              left: menuPanelLeft != null ? `${menuPanelLeft}px` : undefined,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => { handleShare(activeMenuPost); setMenuPostId(null); }}>Copy link</button>
            <button type="button" onClick={() => { saveItemToCollection(activeMenuPost, 'default'); handleSavedNotice('Post was saved', activeMenuPost.post_id); setMenuPostId(null); }}>
              Save
            </button>
            <button type="button" onClick={() => navigate(`/profile/${activeMenuPost.user_id || 'me'}`)}>Go to profile</button>
            <button type="button" onClick={() => { alert('Report submitted'); setMenuPostId(null); }} className="danger">Report</button>
          </div>
        </div>
      )}

      {saveNotice && (
        <div style={{
          position: 'fixed',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(14,14,14,0.92)',
          border: '1px solid var(--card-border)',
          borderRadius: '10px',
          padding: '9px 14px',
          zIndex: 60,
          fontSize: '0.9rem',
          color: 'var(--success-color)',
        }}>
          {saveNotice}
        </div>
      )}
    </div>
  );
}

export default Reels;
