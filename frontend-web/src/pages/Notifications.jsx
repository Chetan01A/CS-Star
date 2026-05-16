import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Heart, MessageSquare, UserPlus, BellOff, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildAssetUrl } from '../config';
import { useLanguage } from '../context/LanguageContext';
import PostModal from '../components/PostModal';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null); // post object for PostModal
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    fetchNotifications();
    markAsSeen();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications/');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsSeen = async () => {
    try {
      await api.post('/notifications/mark-seen');
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart size={18} color="var(--error-color)" fill="var(--error-color)" />;
      case 'comment': return <MessageSquare size={18} color="var(--accent-color)" fill="var(--accent-color)" />;
      case 'reply': return <Reply size={18} color="#f59e0b" fill="none" />;
      case 'follow': return <UserPlus size={18} color="#4facfe" fill="#4facfe" />;
      default: return <Heart size={18} />;
    }
  };

  const handleNotificationClick = (notification) => {
    // Follow → go to the sender's profile
    if (notification.type === 'follow' && notification.sender_id) {
      navigate(`/profile/${notification.sender_id}`);
      return;
    }

    if (notification.post_id) {
      if (notification.post_media_type === 'video') {
        // Video post → open in Reels with the specific reel pre-scrolled
        navigate(`/reels?post=${notification.post_id}`);
      } else {
        // Image post → open PostModal inline
        setSelectedPost({
          post_id: notification.post_id,
          image_url: notification.post_image,
          media_type: notification.post_media_type || 'image',
          user_id: notification.post_user_id,
          caption: notification.post_caption,
          username: notification.sender_username,
          profile_pic: notification.sender_profile_pic,
          likes_count: 0,
          is_liked: false,
        });
      }
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 24px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{t('notifications.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('notifications.subtitle')}</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>{t('notifications.fetching')}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', padding: '64px', opacity: 0.5 }}
              >
                <BellOff size={64} style={{ marginBottom: '16px' }} />
                <p>{t('notifications.empty')}</p>
              </motion.div>
            ) : (
              notifications.map((n, index) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass"
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)',
                    borderLeft: !n.is_seen ? '4px solid var(--accent-color)' : '1px solid var(--card-border)'
                  }}
                  whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div style={{ position: 'relative' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      background: 'var(--accent-gradient)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                    }}>
                      {n.sender_profile_pic ? (
                        <img
                          src={buildAssetUrl(n.sender_profile_pic)}
                          alt={n.sender_username || 'User'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                      ) : (
                        n.sender_username?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div style={{
                      position: 'absolute', bottom: -4, right: -4,
                      background: 'black', borderRadius: '50%', padding: '4px'
                    }}>
                      {getIcon(n.type)}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'white', fontSize: '1rem' }}>
                      <strong>{n.sender_username}</strong> 
                      {n.type === 'like' && " liked your post"}
                      {n.type === 'follow' && " started following you"}
                      {n.type === 'comment' && " commented on your post"}
                      {n.type === 'reply' && " replied to your comment"}
                    </p>
                    {n.text && (
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', opacity: 0.7, fontSize: '0.9rem' }}>
                        "{n.text}"
                      </p>
                    )}
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', opacity: 0.5 }}>
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {n.post_image && (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={buildAssetUrl(n.post_image)} 
                        alt="post"
                        style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', opacity: 0.85 }}
                      />
                      {n.post_media_type === 'video' && (
                        <div style={{
                          position: 'absolute', inset: 0, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(0,0,0,0.35)', borderRadius: '10px'
                        }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <polygon points="5,3 19,12 5,21" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

export default Notifications;
