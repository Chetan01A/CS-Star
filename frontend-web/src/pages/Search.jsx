import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Search as SearchIcon, UserPlus, UserMinus, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { buildAssetUrl } from '../config';
import { useLanguage } from '../context/LanguageContext';

function Search() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState({});
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        handleSearch();
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/profile/search/?query=${encodeURIComponent(query)}`);
      setUsers(data.users || []);
      
      // For each found user, check if we follow them
      // In a real app, the search endpoint should return this
      // For now, we'll just check it manually (basic impl)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (e, userId) => {
    e.stopPropagation(); // Don't navigate to profile
    try {
      if (followingMap[userId]) {
        await api.post('/follow/unfollow', { following_id: userId });
        setFollowingMap(prev => ({ ...prev, [userId]: false }));
      } else {
        await api.post('/follow/follow', { following_id: userId });
        setFollowingMap(prev => ({ ...prev, [userId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
      <h1 className="gradient-text" style={{ marginBottom: '32px' }}>{t('search.title')}</h1>

      {/* Search Input Area */}
      <div className="glass" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        gap: '16px',
        marginBottom: '48px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <SearchIcon color="var(--accent-color)" size={24} />
        <input 
          type="text"
          placeholder={t('search.placeholder')}
          className="input-field"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ 
            border: 'none', 
            background: 'transparent',
            padding: 0,
            fontSize: '1.2rem'
          }}
        />
      </div>

      {/* Results Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading && <p style={{ textAlign: 'center' }}>{t('search.searching')}</p>}
        
        <AnimatePresence>
          {!loading && users.length === 0 && query && (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{t('search.noUsersFound', { query })}</p>
          )}

          {!loading && users.map((u) => (
            <motion.div 
              key={u.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass cursor-pointer"
              onClick={() => navigate(`/profile/${u.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px 24px',
                gap: '16px',
                transition: 'var(--transition-smooth)'
              }}
              whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: '700'
              }}>
                {u.profile_pic ? (
                  <img src={buildAssetUrl(u.profile_pic)} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  u.username?.[0]?.toUpperCase() || '?'
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{u.username}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{u.bio || t('search.noBio')}</p>
              </div>

              <button 
                onClick={(e) => handleFollow(e, u.id)}
                className="btn-primary"
                style={{
                  padding: '8px 16px',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  background: followingMap[u.id] ? 'transparent' : 'var(--accent-gradient)',
                  border: followingMap[u.id] ? '1px solid var(--card-border)' : 'none',
                  color: followingMap[u.id] ? 'var(--text-primary)' : 'black'
                }}
              >
                {followingMap[u.id] ? (
                  <><UserMinus size={16} /> {t('search.unfollow')}</>
                ) : (
                  <><UserPlus size={16} /> {t('search.follow')}</>
                )}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {!query && !loading && (
          <div style={{ textAlign: 'center', padding: '64px', opacity: 0.5 }}>
            <User size={64} style={{ marginBottom: '16px' }} />
            <p>{t('search.startTyping')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
