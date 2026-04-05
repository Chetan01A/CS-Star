import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Heart, MessageSquare, UserPlus, BellOff, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    if (notification.type === 'follow' && notification.sender_id) {
      navigate(`/profile/${notification.sender_id}`);
      return;
    }

    if (notification.post_id) {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '64px 24px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Notifications</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Activity from your universe.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>Fetching activity...</p>
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
                <p>No activity yet.</p>
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
                          src={`http://localhost:8000/${n.sender_profile_pic}`}
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
                    <img 
                      src={`http://localhost:8000/${n.post_image}`} 
                      alt="post"
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', opacity: 0.8 }}
                    />
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default Notifications;
