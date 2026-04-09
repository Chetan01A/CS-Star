import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Bell, Send, Plus, 
  User, LogOut, Heart, Compass, Menu, Settings, Activity, Bookmark, Palette, AlertCircle, Repeat2, PlaySquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

function Sidebar() {
  const [unseenCount, setUnseenCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();

  const fetchUnseenCount = useCallback(async () => {
    try {
      const notifData = await api.get('/notifications/unseen-count');
      setUnseenCount(notifData.count || 0);

      const chatData = await api.get('/chat/unread-count');
      setUnreadMessages(chatData.count || 0);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchUnseenCount();
    const interval = setInterval(fetchUnseenCount, 15000); // Poll every 15s

    // Re-fetch when window gains focus (user comes back to tab)
    const handleFocus = () => fetchUnseenCount();
    window.addEventListener('focus', handleFocus);

    // Listen for real-time unread count changes from Messages page
    const handleUnreadChange = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setUnreadMessages(e.detail.count);
      } else {
        fetchUnseenCount();
      }
    };
    window.addEventListener('unread-messages-changed', handleUnreadChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('unread-messages-changed', handleUnreadChange);
    };
  }, [fetchUnseenCount]);

  useEffect(() => {
    if (!showMoreMenu) return;

    const handleWindowClick = () => {
      setShowMoreMenu(false);
    };

    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [showMoreMenu]);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const handleMenuAction = (action) => {
    if (action === 'settings') {
      setShowMoreMenu(false);
      navigate('/settings');
      return;
    }

    if (action === 'logout') {
      logout();
      return;
    }

    if (action === 'saved') {
      navigate('/saved');
      setShowMoreMenu(false);
      return;
    }

    setShowMoreMenu(false);
    alert(`${action} will be available here.`);
  };

  const menuItems = [
    { name: 'Home', icon: <Home size={28} strokeWidth={2.1} />, path: '/' },
    { name: 'Reels', icon: <PlaySquare size={28} strokeWidth={2.1} />, path: '/reels' },
    { name: 'Messages', icon: <Send size={28} strokeWidth={2.1} />, path: '/messages', badge: unreadMessages },
    { name: 'Search', icon: <Search size={28} strokeWidth={2.1} />, path: '/search' },
    { name: 'Explore', icon: <Compass size={28} strokeWidth={2.1} />, path: '/explore' },
    { name: 'Notifications', icon: <Heart size={28} strokeWidth={2.1} />, path: '/notifications', badge: unseenCount },
    { name: 'Create', icon: <Plus size={28} strokeWidth={2.1} />, path: '/create' },
    { name: 'Profile', icon: <User size={28} strokeWidth={2.1} />, path: '/profile/me' },
  ];

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '280px', zIndex: 1000 }}>
    <div className="sidebar-shell" style={{
      width: '280px',
      height: '100vh',
      position: 'absolute',
      left: 0, top: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '18px 14px 18px',
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      borderRight: 'none',
      borderRadius: 0,
      zIndex: 1000,
      overflow: 'visible',
      transition: 'width 0.22s ease'
    }}>
      <div style={{ height: '32px', marginBottom: '46px', display: 'flex', alignItems: 'center', overflow: 'visible', paddingLeft: '8px' }}>
        <h1 className="gradient-text" style={{
          fontSize: '2rem',
          fontWeight: '900',
          letterSpacing: '-1.5px',
          whiteSpace: 'nowrap'
        }}>
          CS-Star
        </h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              padding: '14px 14px',
              borderRadius: '16px',
              color: 'white',
              background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(14, 20, 28, 0.42)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: `1px solid ${isActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
              textDecoration: 'none',
              fontWeight: isActive ? '700' : '500',
              transition: 'all 0.18s ease',
              position: 'relative',
              boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.12)',
              whiteSpace: 'nowrap'
            })}
            className="sidebar-item"
          >
            <motion.div 
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {item.icon}
            </motion.div>
            <span style={{ fontSize: '0.98rem' }}>{item.name}</span>
            
            {/* Notification Badge */}
            <AnimatePresence>
              {item.badge > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  style={{
                    position: 'absolute',
                    top: '8px', left: '26px',
                    background: 'var(--error-color)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    minWidth: '18px', height: '18px',
                    padding: '0 4px',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #0b1016'
                  }}
                >
                  {item.badge}
                </motion.div>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: '10px' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowMoreMenu((prev) => !prev);
          }}
          className="sidebar-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            padding: '14px 14px',
            borderRadius: '16px',
            color: 'white',
            background: 'rgba(14, 20, 28, 0.42)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.18s ease',
            fontSize: '0.98rem',
            width: '100%',
            whiteSpace: 'nowrap'
          }}
        >
          <Menu size={28} strokeWidth={2.1} />
          <span style={{ fontSize: '0.98rem' }}>More</span>
        </button>

        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="glass"
              style={{
                position: 'fixed',
                left: '18px',
                bottom: '86px',
                width: '260px',
                borderRadius: '22px',
                padding: '10px',
                border: '1px solid var(--card-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 1200
              }}
            >
              {[
                { label: 'Settings', icon: Settings, action: 'settings' },
                { label: 'Your activity', icon: Activity, action: 'Your activity' },
                { label: 'Saved', icon: Bookmark, action: 'saved' },
                { label: 'Switch appearance', icon: Palette, action: 'Switch appearance' },
                { label: 'Report a problem', icon: AlertCircle, action: 'Report a problem' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(item.action);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      textAlign: 'left',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <div style={{ height: '14px' }} />

              {[
                { label: 'Switch Accounts', icon: Repeat2, action: 'Switch Accounts' },
                { label: 'Log out', icon: LogOut, action: 'logout', danger: true },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(item.action);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      color: item.danger ? 'var(--error-color)' : 'white',
                      cursor: 'pointer',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      textAlign: 'left',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
    </div>
  );
}

export default Sidebar;
