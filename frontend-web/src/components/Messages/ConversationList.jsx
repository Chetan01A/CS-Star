import React from 'react';
import { Search } from 'lucide-react';
import Avatar from './Avatar';
import { sameId } from './utils';

const ConversationList = ({ 
  conversations, 
  activeUser, 
  setActiveUser, 
  searchQuery, 
  setSearchQuery, 
  onlineUsers, 
  formatConversationTime, 
  theme, 
  t 
}) => {
  const filteredConversations = conversations.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside style={{ 
      borderRight: `1px solid ${theme.borderSoft}`, 
      background: theme.panelBg, 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden' 
    }}>
      <div style={{ padding: '24px 20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26 }}>{t('messages.title')}</h1>
          <button style={{ 
            width: 38, height: 38, borderRadius: 14, 
            border: `1px solid ${theme.borderStrong}`, 
            background: theme.panelSoft, color: theme.text, cursor: 'pointer' 
          }}>+</button>
        </div>
        <div style={{ 
          marginTop: 18, borderRadius: 18, background: theme.panelSoft, 
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 
        }}>
          <Search size={16} color={theme.textMuted} />
          <input 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            placeholder={t('common.search')} 
            style={{ 
              width: '100%', border: 'none', background: 'transparent', 
              color: theme.text, outline: 'none' 
            }} 
          />
        </div>
      </div>
      <div className="sidebarScroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
        {filteredConversations.map(user => {
          const active = sameId(activeUser?.id, user.id);
          return (
            <button 
              key={user.id} 
              onClick={() => setActiveUser(user)} 
              style={{ 
                display: 'flex', alignItems: 'center', gap: 14, width: '100%', 
                padding: '14px 20px', borderRadius: 20, 
                background: active ? theme.accentSoft : theme.panelMuted, 
                border: active ? `1px solid ${theme.accentStrong}` : 'none', 
                color: theme.text, cursor: 'pointer', textAlign: 'left', marginBottom: 8 
              }}
            >
              <Avatar user={user} size={42} onlineUsers={onlineUsers} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <p style={{ 
                    margin: 0, fontWeight: 700, overflow: 'hidden', 
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                  }}>{user.username}</p>
                  <span style={{ fontSize: 11, color: theme.textMuted, flexShrink: 0 }}>
                    {formatConversationTime(user.lastMessageAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                  <p style={{ 
                    margin: 0, fontSize: 13, color: theme.textMuted, 
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                  }}>{user.lastMessage}</p>
                  {user.unreadCount > 0 && (
                    <span style={{ 
                      minWidth: 20, height: 20, borderRadius: 999, padding: '0 6px', 
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 11, fontWeight: 700, background: theme.accent, 
                      color: theme.accentTextDark, flexShrink: 0 
                    }}>
                      {user.unreadCount > 99 ? '99+' : user.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default ConversationList;
