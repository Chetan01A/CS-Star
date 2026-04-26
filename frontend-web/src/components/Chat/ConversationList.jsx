import React from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const ConversationList = ({ 
  conversations, 
  activeUser, 
  setActiveUser, 
  setConversations, 
  unreadConversationCount, 
  onlineUsers, 
  searchQuery, 
  setSearchQuery,
  renderAvatar
}) => {
  const { t } = useLanguage();
  const filteredConversations = conversations.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside style={{ borderRight: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.94)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '24px 20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 26 }}>{t('messages.title')}</h1>
          </div>
          <button style={{ width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}>+</button>
        </div>
        <div style={{ marginTop: 18, borderRadius: 18, background: 'rgba(255,255,255,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="#94a3b8" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} style={{ width: '100%', border: 'none', background: 'transparent', color: '#e2e8f0', outline: 'none' }} />
        </div>
      </div>
      <div className="sidebarScroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {filteredConversations.map(user => {
          const active = activeUser?.id === user.id;
          return (
            <button 
              key={user.id} 
              onClick={() => { 
                setActiveUser(user); 
                setConversations(prev => prev.map(item => item.id === user.id ? { ...item, unread: false } : item)); 
              }} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                width: '100%', 
                padding: '14px 20px', 
                borderRadius: 20, 
                background: active ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255,255,255,0.03)', 
                border: active ? '1px solid rgba(34, 197, 94, 0.22)' : 'none', 
                color: '#e2e8f0', 
                cursor: 'pointer', 
                textAlign: 'left', 
                marginBottom: 8 
              }}
            >
              {renderAvatar(user, 42)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{user.username}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.lastMessage}
                </p>
              </div>
              {user.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ConversationList;
