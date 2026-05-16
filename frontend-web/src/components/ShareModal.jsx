import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Link2, Facebook, MessageCircle, Mail, Twitter, Send, Check, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { buildAssetUrl } from '../config';
import { useNotice } from '../context/NoticeContext';


const ShareModal = ({ onClose, post }) => {
  const { showNotice } = useNotice();

  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('list'); // 'list' or 'success'

  // Fetch contacts on mount — people you've chatted with + followers/following (like Instagram)
  useEffect(() => {
    const fetchInitialUsers = async () => {
      try {
        const data = await api.get('/chat/contacts');
        const contacts = data.contacts || [];

        setSuggestedUsers(contacts.map(c => ({
          id: c.id,
          name: c.username,
          username: c.username,
          avatar: c.profile_pic,
          lastMessage: c.last_message || null,
        })));
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialUsers();
  }, []);

  // Search logic
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const data = await api.get(`/profile/search/?query=${encodeURIComponent(search)}`);
        setSearchResults((data.users || []).map(u => ({
          id: u.id,
          name: u.username,
          username: u.username,
          avatar: u.profile_pic
        })));
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const toggleUser = (id) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUsers(next);
  };

  const handleSend = async () => {
    try {
      const isVideo = (post.image_url || post.post_image_url || '').match(/\.(mp4|webm|mov|avi|mkv)$/i);
      const shareUrl = isVideo
        ? `${window.location.origin}/reels?post=${post.post_id}`
        : `${window.location.origin}/post/${post.post_id}`;

      const sharePromises = Array.from(selectedUsers).map(userId =>
        api.post('/chat/send', {
          to: userId,
          text: shareUrl,
          message_type: 'post_share',
          media_url: post.image_url || post.post_image_url || null,
        })
      );

      await Promise.all(sharePromises);
      setStep('success');
    } catch (err) {
      console.error('Failed to share:', err);
      showNotice('Failed to share with some friends.', 'error');
    }
  };

  const displayedUsers = search.trim() ? searchResults : suggestedUsers;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 11000,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '440px',
          background: '#121212', borderRadius: '28px',
          overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 70px rgba(0,0,0,0.9)',
          display: 'flex', flexDirection: 'column', maxHeight: '85vh'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <X size={24} />
          </button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Share</span>
          <div style={{ width: '24px' }} />
        </div>

        {step === 'list' ? (
          <>
            {/* Search */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={16} style={{ position: 'absolute', left: '16px', opacity: 0.3 }} />
                <input 
                  type="text"
                  placeholder="Search friends..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: 'none',
                    borderRadius: '14px', padding: '12px 12px 12px 44px', color: 'white',
                    fontSize: '0.95rem', outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* User List — Instagram style */}
            <div style={{ 
              flex: 1, overflowY: 'auto', padding: '0 0 8px',
            }} className="no-scrollbar">
              {loading && displayedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                   <div className="spinner" style={{ margin: '0 auto 12px' }} />
                   Loading...
                </div>
              ) : displayedUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'rgba(255,255,255,0.3)' }}>
                   <User size={36} style={{ opacity: 0.12, marginBottom: '12px' }} />
                   <p style={{ fontSize: '0.9rem', margin: 0 }}>
                     {search.trim() ? 'No users found' : 'No contacts yet. Start a conversation!'}
                   </p>
                </div>
              ) : displayedUsers.map(u => {
                const isSelected = selectedUsers.has(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 24px', cursor: 'pointer',
                      background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                      background: isSelected ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', padding: isSelected ? '2px' : '0',
                      transition: 'all 0.2s', position: 'relative',
                    }}>
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a' }}>
                        {u.avatar ? (
                          <img src={buildAssetUrl(u.avatar)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', opacity: 0.8 }}>{(u.name || 'U')[0].toUpperCase()}</span>
                        )}
                      </div>
                    </div>

                    {/* Name + Last Message */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: isSelected ? 700 : 600, fontSize: '0.97rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.name}
                      </p>
                      {u.lastMessage && (
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {u.lastMessage}
                        </p>
                      )}
                    </div>

                    {/* Selection Circle */}
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                      border: isSelected ? 'none' : '2px solid rgba(255,255,255,0.2)',
                      background: isSelected ? 'var(--accent-color, #00d2ff)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}>
                      {isSelected && <Check size={15} strokeWidth={3} color="black" />}
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Bottom Action Area */}
            <div style={{ background: '#181818', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: selectedUsers.size > 0 ? '0' : '20px' }}>
              <AnimatePresence>
                {selectedUsers.size > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ padding: '20px 24px', overflow: 'hidden' }}
                  >
                    <button 
                      onClick={handleSend}
                      className="btn-primary" 
                      style={{ width: '100%', height: '52px', borderRadius: '14px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                    >
                      Send to {selectedUsers.size} friend{selectedUsers.size > 1 ? 's' : ''}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ color: '#00d2ff', marginBottom: '24px' }}
            >
              <CheckCircle size={80} style={{ margin: '0 auto' }} />
            </motion.div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '12px' }}>Sent!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.5, marginBottom: '40px' }}>
              Shared with {selectedUsers.size} friend{selectedUsers.size > 1 ? 's' : ''}.
            </p>
            <button 
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', height: '52px', borderRadius: '14px', fontWeight: 700 }}
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
      <style>{`
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ShareModal;
