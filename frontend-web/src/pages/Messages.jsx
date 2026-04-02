import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  // Get current user ID from token/profile
  const [currUserId, setCurrUserId] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchFollowing();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      setCurrUserId(data.id);
    } catch (err) { console.error(err); }
  };

  const fetchFollowing = async () => {
    try {
      // For a real messaging app, we'd fetch actual recent chats
      // For now, let's just list people you follow as potential chat partners
      const data = await api.get('/auth/me');
      const resp = await api.get(`/follow/following/${data.id}`);
      setConversations(resp.following || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeUser && currUserId) {
      fetchMessages(activeUser.id);
      setupWebSocket(currUserId);
    }
    return () => {
      if (socket) socket.close();
    };
  }, [activeUser, currUserId]);

  const fetchMessages = async (userId) => {
    try {
      const data = await api.get(`/chat/messages/${userId}`);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) { console.error(err); }
  };

  const setupWebSocket = (userId) => {
    if (socket) socket.close();
    const ws = new WebSocket(`ws://localhost:8000/chat/ws/${userId}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // If message is from the user we are currently chatting with
      if (data.from === activeUser?.id) {
        setMessages(prev => [...prev, { from: data.from, to: userId, text: data.text, time: new Date().toISOString() }]);
        scrollToBottom();
      }
    };
    setSocket(ws);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeUser) return;

    const msgData = { to: activeUser.id, text: newMessage };
    socket.send(JSON.stringify(msgData));

    // Optimistically add to UI
    setMessages(prev => [...prev, { from: currUserId, to: activeUser.id, text: newMessage, time: new Date().toISOString() }]);
    setNewMessage('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Conversation List */}
      <div style={{
        width: '350px',
        borderRight: '1px solid var(--card-border)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <h1 className="gradient-text" style={{ margin: 0 }}>Messages</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
          {conversations.map((user) => (
            <motion.div
              key={user.id}
              whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.05)' }}
              onClick={() => setActiveUser(user)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 16px', borderRadius: '16px', cursor: 'pointer',
                background: activeUser?.id === user.id ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
                border: activeUser?.id === user.id ? '1px solid var(--accent-color)' : '1px solid transparent'
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: 'var(--accent-gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
              }}>
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 'bold', color: 'white' }}>{user.username}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.5 }}>Tap to chat</p>
              </div>
            </motion.div>
          ))}
          {conversations.length === 0 && <p style={{ fontSize: '0.9rem', opacity: 0.5 }}>Follow users to start chatting!</p>}
        </div>
      </div>

      {/* Active Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
        {activeUser ? (
          <>
            {/* Header */}
            <div style={{ padding: '20px 32px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeUser.username[0].toUpperCase()}</div>
              <h3 style={{ margin: 0 }}>{activeUser.username}</h3>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AnimatePresence>
                {messages.map((m, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    style={{
                      maxWidth: '70%',
                      padding: '12px 20px',
                      borderRadius: '20px',
                      alignSelf: m.from === currUserId ? 'flex-end' : 'flex-start',
                      background: m.from === currUserId ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.08)',
                      color: m.from === currUserId ? 'black' : 'white',
                      fontWeight: m.from === currUserId ? '600' : 'normal',
                      boxShadow: m.from === currUserId ? '0 4px 15px rgba(0, 242, 254, 0.2)' : 'none'
                    }}
                  >
                    {m.text}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} style={{ padding: '24px 32px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '16px' }}>
              <input
                type="text"
                placeholder="Message..."
                className="input-field"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '0 24px' }}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
            <MessageCircle size={80} style={{ marginBottom: '24px' }} />
            <h2>Your messages</h2>
            <p>Select a contact to start chatting in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;
