import React from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

const MessageList = ({
  chatScrollRef,
  handleChatScroll,
  isFetchingOlderMessages,
  timelineItems,
  currUserId,
  activeUser,
  formatTime,
  theme,
  activeMenuId,
  setActiveMenuId,
  hoveredMessage,
  setHoveredMessage,
  handleCopy,
  setForwardingMessage,
  handleReport,
  handleDelete,
  setReplyingTo,
  handleReaction,
  handleRetryMessage,
  setSelectedMedia,
  messages,
  messagesEndRef,
}) => {
  return (
    <div 
      ref={chatScrollRef} 
      onScroll={handleChatScroll} 
      className="chatScroll" 
      style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '26px 26px 14px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 10 
      }}
    >
      {isFetchingOlderMessages && (
        <div style={{ alignSelf: 'center', fontSize: 12, color: theme.textMuted, background: theme.panelSoft, borderRadius: 9999, padding: '4px 10px', marginBottom: 8 }}>
          Loading older messages...
        </div>
      )}
      <AnimatePresence>
        {timelineItems.map((item, index) => (
          <MessageBubble
            key={item.key}
            {...item}
            index={index}
            currUserId={currUserId}
            activeUser={activeUser}
            isMine={String(item.message.from) === String(currUserId)}
            formatTime={formatTime}
            theme={theme}
            activeMenuId={activeMenuId}
            setActiveMenuId={setActiveMenuId}
            hoveredMessage={hoveredMessage}
            setHoveredMessage={setHoveredMessage}
            handleCopy={handleCopy}
            setForwardingMessage={setForwardingMessage}
            handleReport={handleReport}
            handleDelete={handleDelete}
            setReplyingTo={setReplyingTo}
            handleReaction={handleReaction}
            handleRetryMessage={handleRetryMessage}
            setSelectedMedia={setSelectedMedia}
            messages={messages}
          />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
