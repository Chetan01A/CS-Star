import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, Heart, MessageCircle, AtSign, Calendar, ChevronRight, BarChart2, Trash2, Archive, Link2, ChevronLeft, Image, PlaySquare, Film, Loader2, X, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api';
import { buildAssetUrl } from '../config';

const ActivityCard = ({ icon: Icon, title, description, color, onClick }) => (
  <button
    onClick={onClick}
    className="glass"
    style={{
      padding: '20px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      width: '100%',
      color: 'white',
      cursor: 'pointer',
      border: '1px solid var(--card-border)',
      background: 'rgba(255,255,255,0.02)',
      textAlign: 'left',
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: `rgba(${color}, 0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid rgba(${color}, 0.3)`,
        color: `rgb(${color})`
      }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem' }}>{title}</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
      </div>
    </div>
    <ChevronRight size={20} color="var(--text-secondary)" />
  </button>
);

const SubPageHeader = ({ title, onBack }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
    <button
      onClick={onBack}
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      <ChevronLeft size={24} />
    </button>
    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{title}</h1>
  </div>
);

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
    <Loader2 size={36} color="#0095f6" style={{ animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

const EmptyState = ({ icon: Icon, title, desc, color }) => (
  <div className="glass" style={{ padding: '48px 32px', borderRadius: '24px', textAlign: 'center' }}>
    <div style={{
      width: '72px', height: '72px', borderRadius: '50%',
      background: `rgba(${color}, 0.12)`, border: `1px solid rgba(${color}, 0.25)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 16px', color: `rgb(${color})`
    }}>
      <Icon size={32} />
    </div>
    <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>{title}</h3>
    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{desc}</p>
  </div>
);

// ── Post Modal ───────────────────────────────────────────────────────────────
const PostModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [isLiked, setIsLiked] = useState(!!post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
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

  const handleLike = async () => {
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount(c => next ? c + 1 : c - 1);
    try {
      await api.post(`/post/${next ? 'like' : 'unlike'}?post_id=${post.post_id}`);
    } catch { setIsLiked(!next); setLikesCount(c => next ? c - 1 : c + 1); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/post/comment?post_id=${post.post_id}&text=${encodeURIComponent(newComment)}`);
      setNewComment('');
      const d = await api.get(`/post/comments/${post.post_id}`);
      setComments(d.comments || []);
    } catch (err) { console.error(err); }
  };

  const mediaUrl = buildAssetUrl(post.image_url || post.post_image_url);
  const isNarrow = window.innerWidth < 900;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', boxSizing: 'border-box',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '1fr 380px',
          gridTemplateRows: isNarrow ? 'auto 1fr' : '1fr',
          width: '100%', maxWidth: '960px',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '18px', overflow: 'hidden',
          background: '#0e0e0e',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Media */}
        <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: isNarrow ? '280px' : 'auto' }}>
          <img
            src={mediaUrl}
            alt={post.caption || 'Post'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: isNarrow ? '320px' : 'calc(100vh - 40px)' }}
          />
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#161616', overflowY: 'auto', maxHeight: isNarrow ? '380px' : 'calc(100vh - 40px)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white', overflow: 'hidden' }}>
                {post.profile_pic ? <img src={buildAssetUrl(post.profile_pic)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : (post.username || 'U')[0].toUpperCase()}
              </div>
              <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>@{post.username || post.post_author}</span>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
              <X size={20} />
            </button>
          </div>

          {/* Caption */}
          {(post.caption) && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ margin: 0, color: 'white', fontSize: '0.9rem', lineHeight: 1.5 }}>
                <strong>@{post.username}</strong> {post.caption}
              </p>
            </div>
          )}

          {/* Likes */}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <button onClick={handleLike} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', color: isLiked ? '#ff4d67' : 'white' }}>
              <Heart size={22} fill={isLiked ? '#ff4d67' : 'none'} color={isLiked ? '#ff4d67' : 'white'} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{likesCount}</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
              <MessageCircle size={20} />
              <span style={{ fontSize: '0.9rem' }}>{comments.length}</span>
            </div>
          </div>

          {/* Comments */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingComments ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center' }}>Loading...</p>
            ) : comments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', textAlign: 'center' }}>No comments yet.</p>
            ) : comments.map(c => (
              <div key={c.id} style={{ marginLeft: c.parent_id ? '16px' : 0, borderLeft: c.parent_id ? '2px solid rgba(255,255,255,0.08)' : 'none', paddingLeft: c.parent_id ? '10px' : 0 }}>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '0.88rem', marginRight: '6px' }}>{c.username}</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem' }}>{c.text}</span>
              </div>
            ))}
          </div>

          {/* Add comment */}
          <form onSubmit={handleComment} style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <input
              type="text" value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input-field"
              style={{ flex: 1, fontSize: '0.88rem', padding: '8px 12px' }}
            />
            <button type="submit" style={{ background: '#0095f6', border: 'none', borderRadius: '10px', padding: '0 14px', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Liked Posts Grid ─────────────────────────────────────────────────────────
const renderLikesPage = (onBack, t, navigate, openModal) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    api.get('/activity/likes')
      .then(data => setPosts(data?.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      <SubPageHeader title={t('Likes')} onBack={onBack} />
      {loading ? <LoadingSpinner /> : posts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={t('No Likes Yet')}
          desc={t('Posts and reels you like will appear here.')}
          color="241, 48, 104"
        />
      ) : (
        <>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {posts.length} {posts.length === 1 ? t('post') : t('posts')}
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3px',
            borderRadius: '16px',
            overflow: 'hidden',
          }}>
            {posts.map(post => (
              <div
                key={post.post_id}
                onClick={() => post.media_type === 'video' ? navigate(`/reels?post=${post.post_id}`) : setSelectedPost(post)}
                style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#111', cursor: 'pointer' }}
              >
                {post.media_type === 'video' ? (
                  <>
                    <video
                      src={buildAssetUrl(post.image_url)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      muted
                    />
                    <div style={{
                      position: 'absolute', top: '8px', right: '8px',
                      background: 'rgba(0,0,0,0.6)', borderRadius: '6px',
                      padding: '3px 5px', display: 'flex', alignItems: 'center',
                    }}>
                      <Film size={14} color="white" />
                    </div>
                  </>
                ) : (
                  <img
                    src={buildAssetUrl(post.image_url)}
                    alt={post.caption || 'Post'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
                {/* hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0)',
                  transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <div style={{ display: 'flex', gap: '12px', opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}
                    className="hover-meta"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontWeight: 700 }}>
                      <Heart size={16} fill="white" /> {post.likes_count}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontWeight: 700 }}>
                      <MessageCircle size={16} fill="white" /> {post.comments_count}
                    </span>
                  </div>
                </div>
                {/* caption tooltip */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '20px 8px 8px',
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                  fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  className="hover-caption"
                >
                  @{post.username}
                </div>
                <style>{`
                  div:hover > .hover-meta { opacity: 1 !important; }
                  div:hover > .hover-caption { opacity: 1 !important; }
                `}</style>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── User Comments List ────────────────────────────────────────────────────────
const renderCommentsPage = (onBack, t, navigate, openModal) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    api.get('/activity/comments')
      .then(data => setComments(data?.comments ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  return (
    <div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      <SubPageHeader title={t('Comments')} onBack={onBack} />
      {loading ? <LoadingSpinner /> : comments.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title={t('No Comments Yet')}
          desc={t('Comments you leave on posts and reels will appear here.')}
          color="0, 149, 246"
        />
      ) : (
        <>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {comments.length} {comments.length === 1 ? t('comment') : t('comments')}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map(c => (
              <div
                key={c.id}
                className="glass"
                onClick={() => c.post_media_type === 'video' ? navigate(`/reels?post=${c.post_id}`) : setSelectedPost({ post_id: c.post_id, post_image_url: c.post_image_url, username: c.post_author, caption: '', is_liked: false, likes_count: 0 })}
                style={{
                  display: 'flex', gap: '14px', alignItems: 'center',
                  padding: '14px 16px', borderRadius: '18px',
                  border: '1px solid var(--card-border)',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                }}
              >
                {/* post thumbnail */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '12px',
                  overflow: 'hidden', flexShrink: 0, background: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {c.post_image_url ? (
                    c.post_media_type === 'video' ? (
                      <video
                        src={buildAssetUrl(c.post_image_url)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        muted
                      />
                    ) : (
                      <img
                        src={buildAssetUrl(c.post_image_url)}
                        alt="post"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )
                  ) : (
                    <Image size={24} color="var(--text-secondary)" />
                  )}
                </div>

                {/* text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    {t('On')} <span style={{ color: 'white', fontWeight: 600 }}>@{c.post_author}</span>'s {c.post_media_type === 'video' ? t('reel') : t('post')}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '1rem', color: 'white',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    fontWeight: 500,
                  }}>
                    "{c.text}"
                  </p>
                </div>

                {/* timestamp */}
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  {formatTime(c.created_at)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── My Posts Grid ────────────────────────────────────────────────────────
const renderMyPostsPage = (onBack, t) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    api.get('/activity/posts')
      .then(data => setPosts(data?.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
      <SubPageHeader title={t('Posts')} onBack={onBack} />
      {loading ? <LoadingSpinner /> : posts.length === 0 ? (
        <EmptyState icon={Image} title={t('No Posts Yet')} desc={t("Photos you've shared will appear here.")} color="0, 200, 83" />
      ) : (
        <>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {posts.length} {posts.length === 1 ? t('post') : t('posts')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', borderRadius: '16px', overflow: 'hidden' }}>
            {posts.map(post => (
              <div
                key={post.post_id}
                onClick={() => setSelectedPost(post)}
                style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#111', cursor: 'pointer' }}
              >
                <img src={buildAssetUrl(post.image_url)} alt={post.caption || 'Post'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <div style={{ display: 'flex', gap: '16px', color: 'white', fontWeight: 700, fontSize: '0.9rem', pointerEvents: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={16} fill="white" /> {post.likes_count}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={16} fill="white" /> {post.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── My Reels Grid ────────────────────────────────────────────────────────
const renderMyReelsPage = (onBack, t, navigate) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity/reels')
      .then(data => setReels(data?.reels ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SubPageHeader title={t('Reels')} onBack={onBack} />
      {loading ? <LoadingSpinner /> : reels.length === 0 ? (
        <EmptyState icon={PlaySquare} title={t('No Reels Yet')} desc={t("Reels you've shared will appear here.")} color="255, 152, 0" />
      ) : (
        <>
          <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {reels.length} {reels.length === 1 ? t('reel') : t('reels')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', borderRadius: '16px', overflow: 'hidden' }}>
            {reels.map(reel => (
              <div
                key={reel.post_id}
                onClick={() => navigate(`/reels?post=${reel.post_id}`)}
                style={{ position: 'relative', aspectRatio: '9/16', overflow: 'hidden', background: '#111', cursor: 'pointer' }}
              >
                <video src={buildAssetUrl(reel.image_url)} muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
                  <Film size={14} color="white" />
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.45)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <div style={{ display: 'flex', gap: '12px', color: 'white', fontWeight: 700, fontSize: '0.9rem', pointerEvents: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={16} fill="white" /> {reel.likes_count}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={16} fill="white" /> {reel.comments_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ── Wrapper components so hooks work correctly ────────────────────────────────
const LikesPage    = ({ onBack, t, navigate }) => renderLikesPage(onBack, t, navigate, null);
const CommentsPage = ({ onBack, t, navigate }) => renderCommentsPage(onBack, t, navigate, null);
const MyPostsPage  = ({ onBack, t }) => renderMyPostsPage(onBack, t);
const MyReelsPage  = ({ onBack, t, navigate }) => renderMyReelsPage(onBack, t, navigate);

function YourActivity() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const renderOverview = () => (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={32} color="#0095f6" />
          {t('Your Activity')}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          {t('One place to manage your interactions, content, and account history. Review and manage everything you\'ve shared on CS-Star.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <ActivityCard
          icon={Heart}
          title={t('Interactions')}
          description={t('Review and manage your likes, comments, and other interactions.')}
          color="241, 48, 104"
          onClick={() => setActiveTab('interactions')}
        />
        <ActivityCard
          icon={BarChart2}
          title={t('Photos and videos')}
          description={t('View, archive, or delete photos and videos you\'ve shared.')}
          color="0, 200, 83"
          onClick={() => setActiveTab('photos-videos')}
        />
        <ActivityCard
          icon={Calendar}
          title={t('Account history')}
          description={t('Review changes you\'ve made to your account since you created it.')}
          color="156, 39, 176"
          onClick={() => setActiveTab('account-history')}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '24px', padding: '24px', borderTop: '1px solid var(--card-border)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t('Some activity may take a few moments to appear here. Downloading your information provides a complete copy of what you\'ve shared.')}
        </p>
      </div>
    </>
  );

  const renderTimeSpent = () => (
    <div>
      <SubPageHeader title={t('Time Spent')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{t('Daily Average')}</p>
        <p style={{ margin: '0 0 32px', fontSize: '3rem', fontWeight: 900 }}>45 {t('m')}</p>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', height: '150px', marginBottom: '16px' }}>
          {[30, 45, 60, 20, 90, 40, 45].map((height, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: `${height}px`, background: i === 6 ? '#0095f6' : 'rgba(255,255,255,0.2)', borderRadius: '8px' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('Your average time spent on CS-Star this week.')}</p>
      </div>
    </div>
  );

  const renderInteractions = () => (
    <div>
      <SubPageHeader title={t('Interactions')} onBack={() => setActiveTab('overview')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ActivityCard
          icon={Heart}
          title={t('Likes')}
          description={t('View and manage your likes.')}
          color="241, 48, 104"
          onClick={() => setActiveTab('likes')}
        />
        <ActivityCard
          icon={MessageCircle}
          title={t('Comments')}
          description={t('View and manage your comments.')}
          color="0, 149, 246"
          onClick={() => setActiveTab('comments')}
        />
        <ActivityCard
          icon={AtSign}
          title={t('Tags')}
          description={t('View and manage posts you are tagged in.')}
          color="156, 39, 176"
          onClick={() => { }}
        />
      </div>
    </div>
  );

  const renderPhotosVideos = () => (
    <div>
      <SubPageHeader title={t('Photos and videos')} onBack={() => setActiveTab('overview')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ActivityCard icon={Image} title={t('Posts')} description={t("View, archive, or delete photos and videos you've shared.")} color="0, 200, 83" onClick={() => setActiveTab('my-posts')} />
        <ActivityCard icon={PlaySquare} title={t('Reels')} description={t("View, archive, or delete Reels you've shared.")} color="255, 152, 0" onClick={() => setActiveTab('my-reels')} />
      </div>
    </div>
  );

  const renderAccountHistory = () => (
    <div>
      <SubPageHeader title={t('Account history')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { date: 'Today', action: 'Bio updated', desc: 'You changed your bio.' },
            { date: 'Last week', action: 'Privacy changed', desc: 'You made your account private.' },
            { date: 'Last month', action: 'Password changed', desc: 'You successfully changed your password.' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{item.action}</p>
                <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLinks = () => (
    <div>
      <SubPageHeader title={t('Links you\'ve visited')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Link2 size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Links Visited')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('You haven\'t visited any external links recently.')}</p>
      </div>
    </div>
  );

  const renderArchived = () => (
    <div>
      <SubPageHeader title={t('Archived')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Archive size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Archived Posts')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('When you archive posts, they will appear here.')}</p>
      </div>
    </div>
  );

  const renderDeleted = () => (
    <div>
      <SubPageHeader title={t('Recently deleted')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Trash2 size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Recently Deleted Content')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('Content you delete will stay here for 30 days before it\'s permanently deleted.')}</p>
      </div>
    </div>
  );

  return (
    <div className="page-shell" style={{ padding: '24px 28px', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {activeTab === 'overview'        && renderOverview()}
        {activeTab === 'time-spent'      && renderTimeSpent()}
        {activeTab === 'interactions'    && renderInteractions()}
        {activeTab === 'likes'           && <LikesPage    onBack={() => setActiveTab('interactions')} t={t} navigate={navigate} />}
        {activeTab === 'comments'        && <CommentsPage onBack={() => setActiveTab('interactions')} t={t} navigate={navigate} />}
        {activeTab === 'photos-videos'   && renderPhotosVideos()}
        {activeTab === 'my-posts'        && <MyPostsPage  onBack={() => setActiveTab('photos-videos')} t={t} />}
        {activeTab === 'my-reels'        && <MyReelsPage  onBack={() => setActiveTab('photos-videos')} t={t} navigate={navigate} />}
        {activeTab === 'account-history' && renderAccountHistory()}
        {activeTab === 'links'           && renderLinks()}
        {activeTab === 'archived'        && renderArchived()}
        {activeTab === 'deleted'         && renderDeleted()}
      </div>
    </div>
  );
}

export default YourActivity;
