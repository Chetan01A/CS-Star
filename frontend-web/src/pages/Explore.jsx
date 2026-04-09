import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildAssetUrl } from '../config';

function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExplore();
  }, []);

  const fetchExplore = async () => {
    try {
      const data = await api.get('/post/explore');
      setPosts(data.explore || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto', padding: '64px 24px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Explore</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Discover trending creators and ideas from the community.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <p>Scanning the multiverse for content...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '28px' 
        }}>
          <AnimatePresence>
            {posts.map((post, index) => (
              <motion.div
                key={post.post_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/profile/${post.user_id || 'me'}`)} // Navigation for simple demo
                style={{ 
                  aspectRatio: '1/1', 
                  position: 'relative', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--card-border)'
                }}
              >
                {post.media_type === 'video' ? (
                  <video
                    src={`${API_BASE_URL}/${post.image_url}`}
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                    <img
                      src={buildAssetUrl(post.image_url)}
                    alt="Explore post"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                
                {/* Overlay on hover */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '24px',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 'bold' }}>
                    <Heart size={24} fill="white" />
                    <span>{post.likes_count || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: 'bold' }}>
                    <MessageCircle size={24} fill="white" />
                    <span>{post.comments_count || 0}</span>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {!loading && posts.length === 0 && (
        <div className="glass" style={{ padding: '64px', textAlign: 'center' }}>
          <p>No discovery content available yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

export default Explore;
