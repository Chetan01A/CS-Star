export const toDate = (timestamp) => {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isSameDay = (aTs, bTs) => {
  const a = toDate(aTs);
  const b = toDate(bTs);
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const getDateSeparatorLabel = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return 'Unknown date';

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((todayStart - dateStart) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getMessageKey = (message, index) => message.id || message.client_id || `${message.from || 'unknown'}-${message.time || 'no-time'}-${index}`;

export const normalizeMessage = (message, currentUserId) => {
  const isMine = message.from === currentUserId;
  let deliveryStatus = message.deliveryStatus;
  if (!deliveryStatus && isMine) {
    deliveryStatus = message.is_read ? 'read' : 'sent';
  }
  if (!deliveryStatus && !isMine) {
    deliveryStatus = 'received';
  }

  return {
    ...message,
    message_type: message.message_type || 'text',
    deliveryStatus,
  };
};

export const sameId = (a, b) => String(a) === String(b);

export const formatTime = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const formatConversationTime = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return formatTime(ts);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const getCallModeLabel = (mode) => (mode === 'video' ? 'Video' : 'Audio');

export const getCallModeArticle = (mode) => (mode === 'audio' ? 'an' : 'a');

export const getSystemCallNotice = (message, currentUserId, activeUsername, previousMessages = []) => {
  if (message.message_type !== 'system') return null;

  const text = (message.text || '').trim();
  const startedMatch = text.match(/started a[n]?\s+(audio|video)\s+call/i);
  if (startedMatch) {
    const mode = startedMatch[1].toLowerCase();
    const actor = sameId(message.from, currentUserId) ? 'You' : (activeUsername || 'They');
    return {
      show: true,
      text: `${actor} started ${getCallModeArticle(mode)} ${mode} call`,
    };
  }

  if (/call ended/i.test(text)) {
    const previousStartedMessage = [...previousMessages].reverse().find((entry) =>
      entry?.message_type === 'system' && /started a[n]?\s+(audio|video)\s+call/i.test(entry.text || '')
    );
    const previousStartedMatch = previousStartedMessage?.text?.match(/started a[n]?\s+(audio|video)\s+call/i);
    const mode = previousStartedMatch?.[1]?.toLowerCase();
    return {
      show: true,
      text: mode ? `${getCallModeLabel(mode)} call ended` : 'Call ended',
    };
  }

  return { show: false, text: '' };
};
