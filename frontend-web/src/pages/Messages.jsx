import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Send, User as UserIcon, MessageCircle, Search, MoreHorizontal, Phone, CornerUpLeft, Smile, MoreVertical, Check, CheckCheck, X, Image as ImageIcon, Mic, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJI_CATEGORIES = {
  "Smileys": ["😃", "😄", "😁", "😆", "😅", "😂", "🤣", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠"],
  "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌", "🐞", "🐜", "🦟", "🦗", "🕷️", "🕸️", "🦂", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈", "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🐘", "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🦬", "🐃", "🐂", "🐄", "🐎", "🐖", "🐏", "🐑", "🐐", "🦌", "🐕", "🐩", "🦮", "🐕‍🦺", "🐈", "🐈‍⬛", "🐓", "🦃", "🦚", "🦜", "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦫", "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔"],
  "Food": ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥣", "🍝", "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🍤", "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡", "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜", "🍯", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻", "🥂", "🥃", "🥤", "🧋", "🧃", "🧉", "🧊"],
  "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", " curling_stone", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️", "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎫", "🎟️", "🎭", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁", "🪘", "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯", "🎳", "🎮", "🎰", "🧩"],
  "Travel": ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏎️", "🏍️", "🛵", "🦽", "🦼", "🛺", "🚲", "🛴", "🛹", "🚏", "🛣️", "🛤️", "🛢️", "⛽", "🚨", "🚥", "🚦", "🛑", "🚧", "⚓", "⛵", "🛶", "🚤", "🛳️", "⛴️", "🛥️", "🚢", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚁", "🚟", "🚠", " cable_car", "🛰️", "🚀", "🛸", "🪐", "🌠", "🌌", "⛱️", "🎆", "🎇", "🎑", "🏙️", "🌆", "🌇", "🌃", "🌉", "🌌", "🏞️", "🌅", "🌄"]
};

function Messages() {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [currUserId, setCurrUserId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [stickerSearch, setStickerSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(recordingIntervalRef.current);
  }, [isRecording]);

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    fetchProfile();
    fetchFollowing();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (activeMenuId) setActiveMenuId(null);
      if (showEmojiPicker) setShowEmojiPicker(false);
      if (showStickerPicker) setShowStickerPicker(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId, showEmojiPicker, showStickerPicker]);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      setCurrUserId(data.id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const data = await api.get('/auth/me');
      const resp = await api.get(`/follow/following/${data.id}`);
      const nextConversations = (resp.following || []).map((user, index) => ({
        ...user,
        lastMessage: 'Tap to open chat',
        unread: index % 3 === 0,
      }));
      setConversations(nextConversations);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeUser && currUserId) {
      fetchMessages(activeUser.id);
      setupWebSocket(currUserId);
      markActiveChatAsRead(activeUser.id);
    }
    return () => {
      if (socket) socket.close();
    };
  }, [activeUser, currUserId]);

  const markActiveChatAsRead = (targetId) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'mark_read', to: targetId }));
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const data = await api.get(`/chat/messages/${userId}`);
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const setupWebSocket = (userId) => {
    if (socket) socket.close();
    const token = localStorage.getItem('access_token');
    const ws = new WebSocket(`ws://localhost:8000/chat/ws?token=${token}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init_online') {
        setOnlineUsers(new Set(data.users));
      } else if (data.type === 'status') {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.status === 'online') next.add(data.user_id);
          else next.delete(data.user_id);
          return next;
        });
      } else if (data.type === 'typing_start') {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(data.from);
          return next;
        });
      } else if (data.type === 'typing_stop') {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.from);
          return next;
        });
      } else if (data.type === 'messages_read') {
        if (data.from === activeUser?.id) {
          setMessages((prev) =>
            prev.map((msg) => (msg.to === data.from ? { ...msg, is_read: true } : msg))
          );
        }
      } else if (data.type === 'delete') {
        setMessages((prev) => prev.filter((msg) => msg.id !== data.id));
      } else if (data.type === 'reaction') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.id ? { ...msg, reactions: data.reactions } : msg
          )
        );
      } else if (data.type === 'chat' || !data.type) {
        if (data.from === activeUser?.id && data.to === currUserId) {
          setMessages((prev) => [
            ...prev,
            { ...data, time: data.time || new Date().toISOString() },
          ]);
          scrollToBottom();
          markActiveChatAsRead(data.from);
        } else if (data.from === currUserId && data.to === activeUser?.id) {
          setMessages((prev) => [
            ...prev,
            { ...data, time: data.time || new Date().toISOString() },
          ]);
          scrollToBottom();
        }
      }
    };
    setSocket(ws);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket && activeUser && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing_start', to: activeUser.id }));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.send(JSON.stringify({ type: 'typing_stop', to: activeUser.id }));
      }, 1500);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !activeUser) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    const msgData = { type: 'chat', to: activeUser.id, text: newMessage, replied_to_id: replyingTo?.id, message_type: 'text' };
    socket.send(JSON.stringify(msgData));
    socket.send(JSON.stringify({ type: 'typing_stop', to: activeUser.id }));
    setNewMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    scrollToBottom();
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorder) { mediaRecorder.stop(); setIsRecording(false); }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const file = new File([blob], 'voice_note.webm', { type: 'audio/webm' });
          setIsUploading(true);
          const formData = new FormData(); formData.append('file', file);
          try {
            const resp = await api.upload('/chat/upload', formData);
            socket.send(JSON.stringify({ type: 'chat', to: activeUser.id, message_type: 'voice', media_url: resp.url, text: '' }));
          } catch (err) { console.error(err); } finally { setIsUploading(false); }
          stream.getTracks().forEach(track => track.stop());
        };
        recorder.start();
        setMediaRecorder(recorder);
        setAudioChunks([]);
        setIsRecording(true);
      } catch (err) { console.error(err); }
    }
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeUser) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await api.upload('/chat/upload', formData);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      socket.send(JSON.stringify({ type: 'chat', to: activeUser.id, message_type: type, media_url: resp.url, text: '' }));
      scrollToBottom();
    } catch (err) { console.error(err); } finally { setIsUploading(false); if (e.target) e.target.value = ''; }
  };

  const handleStickerSelect = (stickerUrl) => {
    if (!activeUser || !socket) return;
    socket.send(JSON.stringify({ type: 'chat', to: activeUser.id, message_type: 'sticker', media_url: stickerUrl, text: '' }));
    setShowStickerPicker(false);
    scrollToBottom();
  };

  const handleReaction = (messageId, emoji) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji, to: activeUser.id }));
    setActiveMenuId(null);
  };

  const handleDelete = (messageId) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'delete', message_id: messageId, to: activeUser.id }));
    setActiveMenuId(null);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setActiveMenuId(null);
  };

  const handleForward = (targetUser, messageText) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: 'chat', to: targetUser.id, text: `[Forwarded]: ${messageText}` }));
    setForwardingMessage(null);
    setActiveMenuId(null);
    setActiveUser(targetUser);
  };

  const handleReport = (messageId) => {
    alert("Message reported successfully.");
    setActiveMenuId(null);
  };

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const renderAvatar = (user, size = 40) => {
    const hasProfilePic = user && user.profile_pic;
    return (
      <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
        {hasProfilePic ? (
          <img src={user.profile_pic.startsWith('http') ? user.profile_pic : `http://localhost:8000/${user.profile_pic}`} alt={user.username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #06b6d4)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.45 }}>{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        )}
        {onlineUsers.has(user?.id) && (
          <span style={{ position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, background: '#22c55e', border: '2px solid #0f172a', borderRadius: '50%' }} />
        )}
      </div>
    );
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const filteredConversations = conversations.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#020717', color: '#e2e8f0' }}>
      <style>{`
        .sidebarScroll::-webkit-scrollbar, .chatScroll::-webkit-scrollbar { width: 6px; }
        .sidebarScroll::-webkit-scrollbar-thumb, .chatScroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 9999px; }
        .sidebarScroll:hover::-webkit-scrollbar-thumb, .chatScroll:hover::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); }
      `}</style>
      
      <div style={{ width: '100%', height: '100dvh', display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
        <aside style={{ borderRight: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.94)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px 20px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ margin: 0, fontSize: 26 }}>Messages</h1>
              <button style={{ width: 38, height: 38, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}>+</button>
            </div>
            <div style={{ marginTop: 18, borderRadius: 18, background: 'rgba(255,255,255,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={16} color="#94a3b8" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" style={{ width: '100%', border: 'none', background: 'transparent', color: '#e2e8f0', outline: 'none' }} />
            </div>
          </div>
          <div className="sidebarScroll" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
            {filteredConversations.map(user => {
              const active = activeUser?.id === user.id;
              return (
                <button key={user.id} onClick={() => setActiveUser(user)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', borderRadius: 20, background: active ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255,255,255,0.03)', border: active ? '1px solid rgba(34, 197, 94, 0.22)' : 'none', color: '#e2e8f0', cursor: 'pointer', textAlign: 'left', marginBottom: 8 }}>
                  {renderAvatar(user, 42)}
                  <div style={{ flex: 1, minWidth: 0 }}><p style={{ margin: 0, fontWeight: 700 }}>{user.username}</p><p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.lastMessage}</p></div>
                </button>
              );
            })}
          </div>
        </aside>

        <main style={{ borderLeft: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(15, 23, 42, 0.96)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeUser ? (
            <>
              <div style={{ padding: '22px 26px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {renderAvatar(activeUser, 52)}
                  <div><h2 style={{ margin: 0, fontSize: 24 }}>{activeUser.username}</h2><p style={{ margin: '4px 0 0', fontSize: 13, color: onlineUsers.has(activeUser.id) ? '#34d399' : '#94a3b8' }}>{onlineUsers.has(activeUser.id) ? 'Active now' : 'Offline'}</p></div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer' }}><Phone size={18} /></button>
                  <button style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer' }}><MoreHorizontal size={18} /></button>
                </div>
              </div>

              <div className="chatScroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 26px 14px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                <AnimatePresence>
                  {messages.map((m, index) => {
                    const isMine = m.from === currUserId;
                    return (
                      <motion.div key={m.id || index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onMouseEnter={() => setHoveredMessage(index)} onMouseLeave={() => setHoveredMessage(null)} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '72%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        {m.replied_to_id && (
                          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px 12px 4px 4px', fontSize: 12, color: '#94a3b8', borderLeft: '3px solid #34d399', marginBottom: -4, opacity: 0.8 }}>
                            {messages.find(msg => msg.id === m.replied_to_id)?.text || "Original message deleted"}
                          </div>
                        )}
                        
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          <div style={{
                            padding: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'voice') ? '0' : '12px 18px',
                            borderRadius: m.replied_to_id ? '4px 22px 22px 22px' : 22,
                            background: (m.message_type === 'sticker' || m.message_type === 'image' || m.message_type === 'video') ? 'none' : (m.message_type === 'voice' ? 'rgba(0,0,0,0.2)' : (isMine ? 'linear-gradient(135deg, #22c55e, #06b6d4)' : 'rgba(255,255,255,0.08)')),
                            color: isMine ? '#020617' : '#e2e8f0', fontSize: 15, position: 'relative'
                          }}>
                            {m.message_type === 'image' && <img src={m.media_url} alt="media" onClick={() => setSelectedMedia({ url: m.media_url, type: 'image' })} style={{ maxWidth: 320, maxHeight: 240, width: '100%', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
                            {m.message_type === 'video' && <video src={m.media_url} controls={false} onClick={() => setSelectedMedia({ url: m.media_url, type: 'video' })} style={{ maxWidth: 320, maxHeight: 240, width: '100%', objectFit: 'cover', borderRadius: 18, display: 'block', cursor: 'pointer' }} />}
                            {m.message_type === 'voice' && <div style={{ padding: '8px 12px' }}><audio src={m.media_url} controls style={{ maxWidth: '100%', height: 32, filter: isMine ? 'invert(1) hue-rotate(180deg)' : 'none' }} /></div>}
                            {m.message_type === 'sticker' && <img src={m.media_url} alt="sticker" style={{ width: 140, height: 140, objectFit: 'contain' }} />}
                            {m.message_type === 'text' && m.text}
                            
                            {/* Reactions Display (Outer Corner) */}
                            {m.reactions && Object.keys(JSON.parse(m.reactions)).length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', [isMine ? 'right' : 'left']: 8, marginTop: -15, display: 'flex', gap: 2, zIndex: 60 }}>
                                {Object.entries(JSON.parse(m.reactions)).map(([emoji, users]) => (
                                  <div key={emoji} style={{ background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.1)', borderRadius: 10, padding: '2px 4px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                                    <span>{emoji}</span><span style={{ color: '#94a3b8' }}>{users.length}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Pill (In front/Side-by-side) */}
                          <AnimatePresence>
                            {(hoveredMessage === index || activeMenuId?.id === m.id) && (
                              <motion.div 
                                initial={{ opacity: 0, x: isMine ? 10 : -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                exit={{ opacity: 0, x: isMine ? 10 : -10 }} 
                                style={{ 
                                  position: 'absolute', 
                                  top: '50%', 
                                  transform: 'translateY(-50%)',
                                  [isMine ? 'right' : 'left']: 'calc(100% + 12px)', 
                                  background: '#000', 
                                  border: '1px solid rgba(255,255,255,0.1)', 
                                  borderRadius: 30, 
                                  padding: '4px 10px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 12, 
                                  zIndex: 100, 
                                  boxShadow: '0 4px 15px rgba(0,0,0,0.5)', 
                                  color: '#94a3b8' 
                                }}
                              >
                                <div style={{ position: 'relative', display: 'flex' }}>
                                  <MoreVertical size={14} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'more' ? null : { id: m.id, type: 'more' }); }} />
                                  {activeMenuId?.id === m.id && activeMenuId?.type === 'more' && (
                                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 12, background: '#1e293b', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: 12, overflow: 'hidden', zIndex: 150, minWidth: 140 }}>
                                      <button onClick={() => handleCopy(m.text)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Copy</button>
                                      <button onClick={() => setForwardingMessage(m)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Forward</button>
                                      {!isMine && <button onClick={() => handleReport(m.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Report</button>}
                                      <button onClick={() => handleDelete(m.id)} style={{ padding: '10px 16px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', width: '100%', textAlign: 'left' }}>Delete</button>
                                    </div>
                                  )}
                                </div>
                                <CornerUpLeft size={14} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(m)} />
                                <div style={{ position: 'relative', display: 'flex' }}>
                                  <Smile size={14} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' ? null : { id: m.id, type: 'emoji' }); }} />
                                  {activeMenuId?.id === m.id && activeMenuId?.type === 'emoji' && (
                                    <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 12, background: '#1e293b', borderRadius: 20, padding: '4px 8px', display: 'flex', gap: 6, zIndex: 150 }}>
                                      {['❤️', '😂', '👍', '🔥', '😮', '😢'].map(emoji => <span key={emoji} style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => handleReaction(m.id, emoji)}>{emoji}</span>)}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: isMine ? 'flex-end' : 'flex-start', marginTop: m.reactions ? 18 : 8 }}>
                          <span style={{ fontSize: 10, color: '#64748b' }}>{formatTime(m.time)}</span>
                          {isMine && <CheckCheck size={14} color={m.is_read ? "#38bdf8" : "#64748b"} />}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence>{replyingTo && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid #34d399' }}>
                    <div style={{ minWidth: 0 }}><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#34d399' }}>Replying to {replyingTo.from === currUserId ? 'yourself' : activeUser.username}</p><p style={{ margin: '4px 0 0', fontSize: 14, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyingTo.text}</p></div>
                    <X size={18} style={{ cursor: 'pointer' }} onClick={() => setReplyingTo(null)} />
                  </motion.div>
                )}</AnimatePresence>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', alignItems: 'center', padding: '4px 8px', border: '1px solid rgba(148, 163, 184, 0.15)', position: 'relative' }}>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} style={{ background: 'none', border: 'none', padding: 8, color: '#94a3b8', cursor: 'pointer' }}><Smile size={24} /></button>
                  <AnimatePresence>{showEmojiPicker && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 16, background: '#1e293b', borderRadius: 24, padding: 16, width: 320, zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
                      <input value={emojiSearch} onChange={e => setEmojiSearch(e.target.value)} placeholder="Search emoji..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '8px 12px', color: '#fff', outline: 'none', marginBottom: 12 }} />
                      <div className="chatScroll" style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {Object.entries(EMOJI_CATEGORIES).map(([cat, list]) => (
                          <div key={cat} style={{ marginBottom: 16 }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>{cat}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                              {list.map(emoji => <span key={emoji} style={{ fontSize: 22, cursor: 'pointer' }} onClick={() => setNewMessage(p => p + emoji)}>{emoji}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}</AnimatePresence>
                  <input value={newMessage} onChange={handleTyping} placeholder="Message..." style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', padding: '12px 8px', outline: 'none' }} />
                  <button type="button" onClick={toggleRecording} style={{ background: 'none', border: 'none', padding: 8, color: isRecording ? '#ef4444' : '#94a3b8', cursor: 'pointer' }}><Mic size={22} /></button>
                  <button type="button" onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', padding: 8, color: '#94a3b8', cursor: 'pointer' }}><ImageIcon size={22} /><input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleMediaUpload} /></button>
                  <button type="submit" style={{ background: 'none', border: 'none', padding: '8px 12px', color: '#06b6d4', cursor: 'pointer' }}><Send size={24} /></button>
                </div>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px' }}>
              <MessageCircle size={96} style={{ color: '#38bdf8' }} /><h2 style={{ fontSize: 32 }}>Pick a chat</h2><p style={{ color: '#94a3b8' }}>Select a contact from the left.</p>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>{forwardingMessage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: 'rgba(2, 7, 23, 0.85)', zIndex: 100, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#0f172a', borderRadius: 28, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3>Forward</h3><X size={20} style={{ cursor: 'pointer' }} onClick={() => setForwardingMessage(null)} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
              {conversations.map(user => (
                <button key={user.id} onClick={() => handleForward(user, forwardingMessage.text)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: 'none', color: '#e2e8f0', cursor: 'pointer' }}>{renderAvatar(user, 36)}<span>{user.username}</span></button>
              ))}
            </div>
          </div>
        </motion.div>
      )}</AnimatePresence>

      <AnimatePresence>{selectedMedia && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMedia(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'grid', placeItems: 'center', cursor: 'zoom-out' }}>
          <button style={{ position: 'absolute', top: 30, right: 30, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 50, height: 50, color: '#fff', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => setSelectedMedia(null)}><X size={30} /></button>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', cursor: 'default' }}>
            {selectedMedia.type === 'image' ? (
              <img src={selectedMedia.url} alt="preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              <video src={selectedMedia.url} controls autoPlay style={{ width: '100%', height: 'auto', display: 'block' }} />
            )}
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

export default Messages;
