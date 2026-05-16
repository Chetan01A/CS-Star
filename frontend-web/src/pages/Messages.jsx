import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { WS_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { useNotice } from '../context/NoticeContext';

import { ArrowLeft, MessageCircle, X, Phone, Video, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Modular components
import Avatar from '../components/Messages/Avatar';
import ConversationList from '../components/Messages/ConversationList';
import MessageList from '../components/Messages/MessageList';
import MessageInput from '../components/Messages/MessageInput';
import CallOverlay from '../components/Messages/CallOverlay';

// Utils and constants
import { 
  toDate, 
  isSameDay, 
  getDateSeparatorLabel, 
  getMessageKey, 
  normalizeMessage, 
  sameId, 
  getSystemCallNotice,
  formatTime,
  formatConversationTime
} from '../components/Messages/utils';
import { 
  EMOJI_CATEGORIES, 
  GROUP_WINDOW_MS, 
  CALL_STATE, 
  RTC_CONFIGURATION 
} from '../components/Messages/constants';

/* eslint-disable react-hooks/exhaustive-deps */



function Messages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeChatId = searchParams.get('chat');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [oldestMessageCursor, setOldestMessageCursor] = useState(null);
  const [isFetchingOlderMessages, setIsFetchingOlderMessages] = useState(false);
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
  const [, setIsUploading] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const { t } = useLanguage();
  const { showNotice } = useNotice();

  const selectConversation = (user, options = {}) => {
    if (!user) return;
    const params = new URLSearchParams(searchParams);
    params.set('chat', user.id);
    setActiveUser(user);
    navigate({ pathname: '/messages', search: `?${params.toString()}` }, { replace: Boolean(options.replace) });
  };

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [, setAudioChunks] = useState([]);
  const [, setRecordingTime] = useState(0);
  const [callState, setCallState] = useState(CALL_STATE.IDLE);
  const [callMode, setCallMode] = useState('audio');
  const [callParticipant, setCallParticipant] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callError, setCallError] = useState('');
  const [callSessionId, setCallSessionId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [callQuality, setCallQuality] = useState({ bitrateKbps: 0, rttMs: 0, packetLossPct: 0 });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [availableDevices, setAvailableDevices] = useState({ audioInput: [], audioOutput: [], videoInput: [] });
  const [selectedAudioInputId, setSelectedAudioInputId] = useState('');
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState('');
  const [selectedVideoInputId, setSelectedVideoInputId] = useState('');
  const [permissionError, setPermissionError] = useState('');
  const [isReconnectingSocket, setIsReconnectingSocket] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [connectionNotice, setConnectionNotice] = useState('');
  const [showConnectionNotice, setShowConnectionNotice] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const pendingAckTimeoutsRef = useRef(new Map());
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const callDurationIntervalRef = useRef(null);
  const callInviteTimeoutRef = useRef(null);
  const qualityIntervalRef = useRef(null);
  const audioLevelIntervalRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const connectionNoticeTimeoutRef = useRef(null);
  const callErrorTimeoutRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callStateRef = useRef(callState);
  const callParticipantRef = useRef(callParticipant);
  const incomingCallDataRef = useRef(incomingCallData);
  const callModeRef = useRef(callMode);
  const callSessionIdRef = useRef(callSessionId);

  const isPhoneViewport = viewportWidth <= 720;
  const isTabletViewport = viewportWidth > 720 && viewportWidth <= 1100;
  const showConversationPane = !isPhoneViewport || !activeUser;

  const clearAckTimeout = (clientId) => {
    const timeoutId = pendingAckTimeoutsRef.current.get(clientId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      pendingAckTimeoutsRef.current.delete(clientId);
    }
  };

  const scheduleAckTimeout = (clientId) => {
    clearAckTimeout(clientId);
    const timeoutId = setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) => (msg.client_id === clientId && msg.deliveryStatus === 'sending' ? { ...msg, deliveryStatus: 'failed' } : msg))
      );
      pendingAckTimeoutsRef.current.delete(clientId);
    }, 10000);
    pendingAckTimeoutsRef.current.set(clientId, timeoutId);
  };

  const markFailed = (clientId) => {
    clearAckTimeout(clientId);
    setMessages((prev) => prev.map((msg) => (msg.client_id === clientId ? { ...msg, deliveryStatus: 'failed' } : msg)));
  };

  const trySendMessage = (message) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      markFailed(message.client_id);
      return;
    }

    const payload = {
      type: 'chat',
      to: message.to,
      text: message.text,
      replied_to_id: message.replied_to_id,
      message_type: message.message_type || 'text',
      client_id: message.client_id,
    };

    try {
      socket.send(JSON.stringify(payload));
      socket.send(JSON.stringify({ type: 'typing_stop', to: activeUser?.id }));
      scheduleAckTimeout(message.client_id);
    } catch (error) {
      console.error(error);
      markFailed(message.client_id);
    }
  };

  const handleRetryMessage = (clientId) => {
    const retryTarget = messages.find((msg) => msg.client_id === clientId);
    if (!retryTarget) return;

    setMessages((prev) => prev.map((msg) => (msg.client_id === clientId ? { ...msg, deliveryStatus: 'sending' } : msg)));
    trySendMessage(retryTarget);
  };

  const stopCallTimers = () => {
    clearInterval(callDurationIntervalRef.current);
    clearInterval(qualityIntervalRef.current);
    clearInterval(audioLevelIntervalRef.current);
    clearTimeout(callInviteTimeoutRef.current);
  };

  const cleanupPeerConnection = () => {
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch (error) {
        console.error(error);
      }
      peerConnectionRef.current = null;
    }
  };

  const cleanupMediaStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
      analyserRef.current = null;
    }
  };

  const sendCallSignal = (type, toUserId, extra = {}) => {
    const ws = socketRef.current || socket;
    if (!ws || ws.readyState !== WebSocket.OPEN || !toUserId) return false;
    try {
      ws.send(JSON.stringify({ type, to: toUserId, ...extra }));
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const beginCallDurationTimer = () => {
    setCallDuration(0);
    clearInterval(callDurationIntervalRef.current);
    callDurationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const startQualityMonitor = () => {
    clearInterval(qualityIntervalRef.current);
    qualityIntervalRef.current = setInterval(async () => {
      if (!peerConnectionRef.current) return;
      try {
        const stats = await peerConnectionRef.current.getStats();
        let selectedCandidatePair = null;
        let inbound = null;
        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded' && report.currentRoundTripTime) {
            selectedCandidatePair = report;
          }
          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            inbound = report;
          }
        });

        const bitrate = inbound?.bytesReceived && inbound?.timestamp
          ? Math.round((inbound.bytesReceived * 8) / 1000)
          : 0;
        const packetsLost = inbound?.packetsLost || 0;
        const packetsReceived = inbound?.packetsReceived || 0;
        const totalPackets = packetsLost + packetsReceived;
        const packetLossPct = totalPackets > 0 ? Number(((packetsLost / totalPackets) * 100).toFixed(1)) : 0;
        const rttMs = selectedCandidatePair?.currentRoundTripTime ? Math.round(selectedCandidatePair.currentRoundTripTime * 1000) : 0;

        setCallQuality({ bitrateKbps: bitrate, rttMs, packetLossPct });
      } catch (error) {
        console.error(error);
      }
    }, 2500);
  };

  const startInputLevelMonitor = (stream) => {
    clearInterval(audioLevelIntervalRef.current);
    if (!stream) return;

    try {
      const audioContext = new window.AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioLevelIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setInputLevel(Math.min(100, Math.round((avg / 255) * 100)));
      }, 150);
    } catch (error) {
      console.error(error);
    }
  };

  const applyLowBandwidthConstraints = async (enabled) => {
    if (!peerConnectionRef.current) return;
    const senders = peerConnectionRef.current.getSenders();
    await Promise.all(
      senders.map(async (sender) => {
        if (!sender.track || sender.track.kind !== 'video') return;
        const params = sender.getParameters();
        if (!params.encodings || !params.encodings.length) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = enabled ? 200_000 : 1_200_000;
        await sender.setParameters(params);
      })
    );
  };

  const setupOutputDevice = async () => {
    if (!selectedAudioOutputId || !remoteAudioRef.current?.setSinkId) return;
    try {
      await remoteAudioRef.current.setSinkId(selectedAudioOutputId);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshMediaDevices = async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInput = devices.filter((d) => d.kind === 'audioinput');
      const audioOutput = devices.filter((d) => d.kind === 'audiooutput');
      const videoInput = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices({ audioInput, audioOutput, videoInput });
      if (!selectedAudioInputId && audioInput[0]) setSelectedAudioInputId(audioInput[0].deviceId);
      if (!selectedAudioOutputId && audioOutput[0]) setSelectedAudioOutputId(audioOutput[0].deviceId);
      if (!selectedVideoInputId && videoInput[0]) setSelectedVideoInputId(videoInput[0].deviceId);
    } catch (error) {
      console.error(error);
    }
  };

  const ensureLocalMedia = async (mode, preferredVideoDeviceId = selectedVideoInputId, preferredAudioDeviceId = selectedAudioInputId) => {
    const wantsVideo = mode === 'video';
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermissionError('Media devices are not supported in this browser.');
      throw new Error('media_devices_unsupported');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: preferredAudioDeviceId ? { deviceId: { exact: preferredAudioDeviceId } } : true,
        video: wantsVideo ? (preferredVideoDeviceId ? { deviceId: { exact: preferredVideoDeviceId } } : true) : false,
      });
      setPermissionError('');
      setLocalStream(stream);
      startInputLevelMonitor(stream);
      if (localVideoRef.current && wantsVideo) {
        localVideoRef.current.srcObject = stream;
      }
      return { stream, resolvedMode: wantsVideo ? 'video' : 'audio' };
    } catch (error) {
      if (wantsVideo) {
        try {
          const fallbackAudio = await navigator.mediaDevices.getUserMedia({
            audio: preferredAudioDeviceId ? { deviceId: { exact: preferredAudioDeviceId } } : true,
            video: false,
          });
          setCallMode('audio');
          setPermissionError('Camera unavailable, switched to audio-only.');
          setLocalStream(fallbackAudio);
          startInputLevelMonitor(fallbackAudio);
          if (localVideoRef.current) localVideoRef.current.srcObject = null;
          return { stream: fallbackAudio, resolvedMode: 'audio' };
        } catch (audioFallbackError) {
          console.error(audioFallbackError);
        }
      }
      const message = error?.name === 'NotAllowedError' ? 'Microphone/Camera permission denied.' : 'Unable to access media devices.';
      setPermissionError(message);
      throw error;
    }
  };

  const setupPeerConnection = (targetId, mode, sessionId) => {
    cleanupPeerConnection();
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      sendCallSignal('webrtc_ice_candidate', targetId, { call_id: sessionId, candidate: event.candidate });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;
      setRemoteStream(stream);
      if (mode === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
      setupOutputDevice();
      setCallState(CALL_STATE.ACTIVE);
      beginCallDurationTimer();
      startQualityMonitor();
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed' || state === 'disconnected') {
        setCallError('Call connection lost. Attempting recovery...');
        setCallState(CALL_STATE.FAILED);
      }
      if (state === 'connected') {
        setCallState(CALL_STATE.ACTIVE);
      }
    };

    return pc;
  };

  const resetCallState = ({ keepError = false } = {}) => {
    stopCallTimers();
    cleanupPeerConnection();
    cleanupMediaStreams();
    setCallDuration(0);
    setCallQuality({ bitrateKbps: 0, rttMs: 0, packetLossPct: 0 });
    setInputLevel(0);
    setCallSessionId(null);
    setCallState(CALL_STATE.IDLE);
    setCallMode('audio');
    setCallParticipant(null);
    setIncomingCallData(null);
    setIsMuted(false);
    setIsCameraEnabled(true);
    setIsLowBandwidth(false);
    setIsCallMinimized(false);
    if (!keepError) setCallError('');
  };

  const startCall = async (mode) => {
    if (!activeUser || callState !== CALL_STATE.IDLE) return;
    let resolvedMode = mode;
    try {
      setPermissionError('');
      setCallError('');
      setCallMode(mode);
      setCallParticipant(activeUser);
      setCallState(CALL_STATE.DIALING);
      const media = await ensureLocalMedia(mode);
      resolvedMode = media.resolvedMode;
      setCallMode(resolvedMode);
    } catch (error) {
      setCallError('Cannot start call without media permission.');
      setCallState(CALL_STATE.FAILED);
      return;
    }

    const sent = sendCallSignal('call_invite', activeUser.id, { call_mode: resolvedMode, preferred_low_bandwidth: isLowBandwidth });
    if (!sent) {
      setCallError('Unable to start call right now.');
      setCallState(CALL_STATE.FAILED);
      return;
    }
    clearTimeout(callInviteTimeoutRef.current);
    callInviteTimeoutRef.current = setTimeout(() => {
      if (callStateRef.current === CALL_STATE.DIALING || callStateRef.current === CALL_STATE.CONNECTING) {
        setCallError('No answer. Call marked as missed.');
        setCallState(CALL_STATE.ENDED);
        endCall({ notify: false });
      }
    }, 30000);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCallData?.from || !incomingCallData?.call_id) return;
    setCallState(CALL_STATE.CONNECTING);
    let resolvedMode = incomingCallData.call_mode || 'audio';
    try {
      const media = await ensureLocalMedia(incomingCallData.call_mode || 'audio');
      resolvedMode = media.resolvedMode;
    } catch (error) {
      setCallError('Unable to accept call without media permission.');
      setCallState(CALL_STATE.FAILED);
      sendCallSignal('call_reject', incomingCallData.from, { call_id: incomingCallData.call_id, reason: 'permission_denied' });
      return;
    }
    setCallSessionId(incomingCallData.call_id);
    setCallMode(resolvedMode);
    setCallError('');
    sendCallSignal('call_accept', incomingCallData.from, { call_mode: resolvedMode, call_id: incomingCallData.call_id });
  };

  const declineIncomingCall = () => {
    if (incomingCallData?.from) {
      sendCallSignal('call_reject', incomingCallData.from, { call_mode: incomingCallData.call_mode || 'audio', call_id: incomingCallData.call_id });
    }
    resetCallState();
  };

  const endCall = ({ notify = true } = {}) => {
    const targetId = incomingCallData?.from || callParticipant?.id;
    if (notify && targetId) {
      sendCallSignal('call_end', targetId, { call_mode: callMode, call_id: callSessionId });
    }
    resetCallState();
  };

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => {
      pendingAckTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingAckTimeoutsRef.current.clear();
      if (connectionNoticeTimeoutRef.current) clearTimeout(connectionNoticeTimeoutRef.current);
      stopCallTimers();
      cleanupPeerConnection();
      cleanupMediaStreams();
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchProfile();
    fetchFollowing();
    refreshMediaDevices();
    if (navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshMediaDevices);
    }
    return () => {
      if (navigator?.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', refreshMediaDevices);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setupOutputDevice();
  }, [selectedAudioOutputId, remoteStream]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    callParticipantRef.current = callParticipant;
  }, [callParticipant]);

  useEffect(() => {
    incomingCallDataRef.current = incomingCallData;
  }, [incomingCallData]);

  useEffect(() => {
    callModeRef.current = callMode;
  }, [callMode]);

  useEffect(() => {
    callSessionIdRef.current = callSessionId;
  }, [callSessionId]);

  useEffect(() => {
    if (callErrorTimeoutRef.current) clearTimeout(callErrorTimeoutRef.current);
    if (!callError) return undefined;

    callErrorTimeoutRef.current = setTimeout(() => {
      setCallError('');
    }, 4500);

    return () => {
      if (callErrorTimeoutRef.current) clearTimeout(callErrorTimeoutRef.current);
    };
  }, [callError]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const updateAudioInput = async () => {
      if (!selectedAudioInputId || !localStreamRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedAudioInputId } },
          video: false,
        });
        const newAudioTrack = stream.getAudioTracks()[0];
        if (!newAudioTrack) return;
        const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === 'audio');
        if (sender) await sender.replaceTrack(newAudioTrack);

        const previousAudioTrack = localStreamRef.current.getAudioTracks()[0];
        if (previousAudioTrack) previousAudioTrack.stop();
        const merged = new MediaStream([newAudioTrack, ...localStreamRef.current.getVideoTracks()]);
        setLocalStream(merged);
        startInputLevelMonitor(merged);
      } catch (error) {
        console.error(error);
      }
    };
    if (callState === CALL_STATE.ACTIVE || callState === CALL_STATE.CONNECTING) {
      updateAudioInput();
    }
  }, [selectedAudioInputId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (callMode === 'video' && selectedVideoInputId && (callState === CALL_STATE.ACTIVE || callState === CALL_STATE.CONNECTING)) {
      switchCamera(selectedVideoInputId).catch(() => {});
    }
  }, [selectedVideoInputId]);

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
      const resp = await api.get('/chat/contacts');
      const nextConversations = (resp.contacts || []).map((user) => ({
        ...user,
        lastMessage: user.last_message || 'Tap to open chat',
        lastMessageAt: user.last_message_at,
        unreadCount: user.unread_count || 0,
      }));
      setConversations(nextConversations);
      setActiveUser((prev) => {
        if (!prev) return null;
        const refreshedActiveUser = nextConversations.find((user) => sameId(user.id, prev.id));
        return refreshedActiveUser || null;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!conversations.length) return;

    if (!activeChatId) {
      setActiveUser(null);
      setMessages([]);
      return;
    }

    const chatFromUrl = conversations.find((user) => sameId(user.id, activeChatId));
    if (chatFromUrl && !sameId(activeUser?.id, chatFromUrl.id)) {
      setActiveUser(chatFromUrl);
    }
  }, [activeChatId, conversations, activeUser?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!currUserId) return;
    setupWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [currUserId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!activeUser || !currUserId) return;
    setHasMoreMessages(true);
    setOldestMessageCursor(null);
    fetchMessages(activeUser.id, { appendOlder: false });
    markActiveChatAsRead(activeUser.id);
    setConversations((prev) =>
      prev.map((contact) =>
        contact.id === activeUser.id ? { ...contact, unreadCount: 0 } : contact
      )
    );
  }, [activeUser, currUserId]);

  const markActiveChatAsRead = (targetId) => {
    const ws = socketRef.current || socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'mark_read', to: targetId }));
    }
  };

  const fetchMessages = async (userId, options = {}) => {
    const { before = null, appendOlder = false } = options;
    if (appendOlder && (isFetchingOlderMessages || !hasMoreMessages || !before)) return;

    if (appendOlder) setIsFetchingOlderMessages(true);

    const scrollEl = chatScrollRef.current;
    const previousScrollHeight = appendOlder ? (scrollEl?.scrollHeight || 0) : 0;
    const previousScrollTop = appendOlder ? (scrollEl?.scrollTop || 0) : 0;

    try {
      const params = new URLSearchParams();
      params.set('limit', '40');
      if (before) params.set('before', before);
      const data = await api.get(`/chat/messages/${userId}?${params.toString()}`);
      const normalized = (data.messages || []).map((message) => normalizeMessage(message, currUserId));

      if (appendOlder) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((msg) => msg.id).filter(Boolean));
          const dedupedOlder = normalized.filter((msg) => !msg.id || !existingIds.has(msg.id));
          return [...dedupedOlder, ...prev];
        });
      } else {
        setMessages(normalized);
      }

      setHasMoreMessages(Boolean(data.has_more));
      setOldestMessageCursor(data.next_before || null);

      if (appendOlder) {
        requestAnimationFrame(() => {
          const currentEl = chatScrollRef.current;
          if (!currentEl) return;
          const newScrollHeight = currentEl.scrollHeight;
          currentEl.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
        });
      } else {
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (appendOlder) setIsFetchingOlderMessages(false);
    }
  };

  const setupWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onclose = null;
      socketRef.current.onerror = null;
      socketRef.current.close();
    }
    const token = localStorage.getItem('access_token');
    const explicitWsBase = import.meta.env.VITE_WS_URL || WS_BASE_URL;
    const normalizedBase = explicitWsBase
      ? explicitWsBase.replace(/\/+$/, '')
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname || 'localhost'}:8000`;
    const ws = new WebSocket(`${normalizedBase}/chat/ws?token=${token}`);
    socketRef.current = ws;
    let opened = false;
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'init_online') {
        if (!opened) {
          opened = true;
          showConnectionStatus(
            reconnectAttemptRef.current > 0 ? 'Reconnected to chat' : '',
            'connected',
            reconnectAttemptRef.current > 0 ? 2500 : 0
          );
        }

        reconnectAttemptRef.current = 0;
        setIsReconnectingSocket(false);
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
      } else if (data.type === 'call_invite') {
        if (sameId(data.from, currUserId)) {
          setCallSessionId(data.call_id || null);
          setCallState((prev) => (prev === CALL_STATE.DIALING ? CALL_STATE.CONNECTING : prev));
          return;
        }
        if (callStateRef.current !== CALL_STATE.IDLE) {
          sendCallSignal('call_busy', data.from, { call_id: data.call_id, reason: 'already_in_call' });
          return;
        }
        const participantFromList = conversations.find((user) => user.id === data.from);
        const participant = participantFromList || {
          id: data.from,
          username: data.from_username || 'Unknown user',
          profile_pic: data.from_profile_pic || '',
        };
        setCallMode(data.call_mode || 'audio');
        setCallParticipant(participant);
        setIncomingCallData(data);
        setCallSessionId(data.call_id || null);
        setCallError('');
        setCallState(CALL_STATE.RINGING);
      } else if (data.type === 'call_accept') {
        if ((callStateRef.current === CALL_STATE.DIALING || callStateRef.current === CALL_STATE.CONNECTING) && sameId(callParticipantRef.current?.id, data.from)) {
          const sessionId = data.call_id || callSessionIdRef.current;
          setCallSessionId(sessionId || null);
          setCallState(CALL_STATE.CONNECTING);
          setIncomingCallData(null);
          setCallError('');
          clearTimeout(callInviteTimeoutRef.current);

          const mode = data.call_mode || callModeRef.current;
          const pc = setupPeerConnection(data.from, mode, sessionId);
          const stream = localStreamRef.current;
          if (stream) {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          }
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              sendCallSignal('webrtc_offer', data.from, { call_id: sessionId, offer: pc.localDescription, call_mode: mode });
            })
            .catch((error) => {
              console.error(error);
              setCallError('Failed to create call offer.');
              setCallState(CALL_STATE.FAILED);
            });
        }
      } else if (data.type === 'call_reject') {
        if (sameId(callParticipantRef.current?.id, data.from) || sameId(incomingCallDataRef.current?.from, data.from)) {
          setCallError('Call declined');
          setCallState(CALL_STATE.ENDED);
          resetCallState({ keepError: true });
        }
      } else if (data.type === 'call_busy') {
        if (sameId(callParticipantRef.current?.id, data.from) || sameId(incomingCallDataRef.current?.from, data.from)) {
          setCallError('User is busy on another call');
          setCallState(CALL_STATE.FAILED);
          resetCallState({ keepError: true });
        }
      } else if (data.type === 'call_missed') {
        setCallError('Missed call');
        setCallState(CALL_STATE.ENDED);
        resetCallState({ keepError: true });
      } else if (data.type === 'call_end') {
        if (sameId(callParticipantRef.current?.id, data.from) || sameId(incomingCallDataRef.current?.from, data.from)) {
          setCallError(data.reason === 'disconnect' ? 'Call ended due to disconnect' : 'Call ended');
          setCallState(CALL_STATE.ENDED);
          resetCallState({ keepError: true });
        }
      } else if (data.type === 'webrtc_offer') {
        if (!data.call_id || !sameId(data.from, incomingCallDataRef.current?.from)) return;
        const mode = data.call_mode || callModeRef.current;
        setCallSessionId(data.call_id);
        setCallMode(mode);
        const pc = setupPeerConnection(data.from, mode, data.call_id);
        const stream = localStreamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        }
        pc.setRemoteDescription(new RTCSessionDescription(data.offer))
          .then(() => pc.createAnswer())
          .then((answer) => pc.setLocalDescription(answer))
          .then(() => {
            sendCallSignal('webrtc_answer', data.from, { call_id: data.call_id, answer: pc.localDescription });
          })
          .catch((error) => {
            console.error(error);
            setCallError('Failed to answer incoming call.');
            setCallState(CALL_STATE.FAILED);
          });
      } else if (data.type === 'webrtc_answer') {
        if (!peerConnectionRef.current || !data.answer) return;
        peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer)).catch((error) => {
          console.error(error);
          setCallError('Failed to finalize call connection.');
          setCallState(CALL_STATE.FAILED);
        });
      } else if (data.type === 'webrtc_ice_candidate') {
        if (!peerConnectionRef.current || !data.candidate) return;
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)).catch((error) => {
          console.error(error);
        });
      } else if (data.type === 'screen_share_status') {
        // Placeholder state hook for UI parity; keeping as no-op for now.
        if (data.from === callParticipantRef.current?.id) {
          setCallError(data.is_sharing ? `${callParticipantRef.current.username} started sharing screen` : `${callParticipantRef.current.username} stopped sharing screen`);
        }
      } else if (data.type === 'messages_read') {
        if (sameId(data.from, activeUser?.id)) {
          setMessages((prev) =>
            prev.map((msg) => (sameId(msg.to, data.from) ? { ...msg, is_read: true, deliveryStatus: 'read' } : msg))
          );
          setConversations((prev) =>
            prev.map((contact) =>
              sameId(contact.id, data.from) ? { ...contact, unreadCount: 0 } : contact
            )
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
      } else if (data.type === 'chat_ack') {
        if (!data.client_id) return;
        clearAckTimeout(data.client_id);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.client_id === data.client_id
              ? {
                  ...msg,
                  id: data.id ?? msg.id,
                  time: data.time || msg.time,
                  deliveryStatus: 'sent',
                }
              : msg
          )
        );
      } else if (data.type === 'chat' || !data.type) {
        const incomingMessage = normalizeMessage({ ...data, time: data.time || new Date().toISOString() }, currUserId);
        const messagePreview = incomingMessage.message_type === 'text'
          ? incomingMessage.text
          : incomingMessage.message_type === 'image'
            ? 'Image'
            : incomingMessage.message_type === 'video'
              ? 'Video'
              : incomingMessage.message_type === 'voice'
                ? 'Voice note'
                : 'Message';

        if (sameId(data.from, currUserId) && sameId(data.to, activeUser?.id)) {
          if (!data.client_id) return;
          setMessages((prev) => {
            const matchIndex = prev.findIndex((msg) => msg.client_id === data.client_id);

            if (matchIndex === -1) {
              return prev;
            }

            const matched = prev[matchIndex];
            clearAckTimeout(data.client_id);

            const next = [...prev];
            next[matchIndex] = {
              ...matched,
              ...incomingMessage,
              client_id: data.client_id,
              deliveryStatus: incomingMessage.is_read ? 'read' : 'sent',
            };
            return next;
          });
          updateConversationMeta({
            userId: data.to,
            previewText: messagePreview,
            timestamp: incomingMessage.time,
            incrementUnread: false,
          });
          scrollToBottom();
        } else if (sameId(data.from, activeUser?.id) && sameId(data.to, currUserId)) {
          setMessages((prev) => [...prev, incomingMessage]);
          updateConversationMeta({
            userId: data.from,
            previewText: messagePreview,
            timestamp: incomingMessage.time,
            incrementUnread: false,
          });
          scrollToBottom();
          markActiveChatAsRead(data.from);
        } else if (sameId(data.to, currUserId)) {
          updateConversationMeta({
            userId: data.from,
            previewText: messagePreview,
            timestamp: incomingMessage.time,
            incrementUnread: true,
          });
        }
      }
    };
    ws.onopen = () => {
      if (socketRef.current !== ws) return;
      opened = true;
      setIsReconnectingSocket(false);
      if (reconnectAttemptRef.current > 0) {
        showConnectionStatus('Reconnected to chat', 'connected', 2500);
      } else {
        setShowConnectionNotice(false);
      }

      setConnectionStatus('connected');
    };
    ws.onclose = () => {
      if (socketRef.current !== ws) return;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      const shouldAttemptReconnect = !!currUserId;
      if (!shouldAttemptReconnect) return;
      setIsReconnectingSocket(true);
      showConnectionStatus(
        reconnectAttemptRef.current > 0
          ? `Still reconnecting... (attempt ${reconnectAttemptRef.current + 1})`
          : 'Connection lost. Reconnecting...',
        'reconnecting'
      );

      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(6000, 800 * attempt);
      reconnectTimeoutRef.current = setTimeout(() => {
        setupWebSocket();
      }, delay);
    };
    ws.onerror = () => {
      if (socketRef.current !== ws) return;
      if (reconnectAttemptRef.current >= 2) {
        showConnectionStatus('Unable to reach chat server. Retrying...', 'error');
      }

    };
    setSocket(ws);
  };

  const toggleMute = () => {
    if (!localStream) return;
    const nextMuted = !isMuted;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setIsMuted(nextMuted);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const nextCameraEnabled = !isCameraEnabled;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = nextCameraEnabled;
    });
    setIsCameraEnabled(nextCameraEnabled);
  };

  const switchCamera = async (forcedDeviceId = null) => {
    if (!localStream || availableDevices.videoInput.length < 1) return;
    const currentIndex = availableDevices.videoInput.findIndex((d) => d.deviceId === selectedVideoInputId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % availableDevices.videoInput.length : 0;
    const nextDevice = forcedDeviceId
      ? availableDevices.videoInput.find((d) => d.deviceId === forcedDeviceId) || availableDevices.videoInput[0]
      : availableDevices.videoInput[nextIndex];
    setSelectedVideoInputId(nextDevice.deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDevice.deviceId } },
        audio: false,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const sender = peerConnectionRef.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) await sender.replaceTrack(newVideoTrack);

      const oldTrack = localStream.getVideoTracks()[0];
      if (oldTrack) oldTrack.stop();

      const mergedStream = new MediaStream([...localStream.getAudioTracks(), newVideoTrack]);
      setLocalStream(mergedStream);
      if (localVideoRef.current) localVideoRef.current.srcObject = mergedStream;
    } catch (error) {
      console.error(error);
      setCallError('Unable to switch camera.');
    }
  };

  const toggleLowBandwidthMode = async () => {
    const next = !isLowBandwidth;
    setIsLowBandwidth(next);
    try {
      await applyLowBandwidthConstraints(next);
    } catch (error) {
      console.error(error);
    }
  };

  const attemptManualReconnect = () => {
    if (!currUserId) return;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    setIsReconnectingSocket(true);
    setupWebSocket();
  };

  const showConnectionStatus = (message, status = 'connected', autoHideMs = 0) => {
    if (connectionNoticeTimeoutRef.current) clearTimeout(connectionNoticeTimeoutRef.current);
    setConnectionStatus(status);
    setConnectionNotice(message);
    setShowConnectionNotice(Boolean(message));
    if (autoHideMs > 0) {
      connectionNoticeTimeoutRef.current = setTimeout(() => {
        setShowConnectionNotice(false);
      }, autoHideMs);
    }
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
    const text = newMessage.trim();
    if (!text || !activeUser || !currUserId) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const optimisticMessage = {
      client_id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: currUserId,
      to: activeUser.id,
      text,
      time: new Date().toISOString(),
      replied_to_id: replyingTo?.id,
      message_type: 'text',
      deliveryStatus: 'sending',
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    scrollToBottom();
    trySendMessage(optimisticMessage);
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
    const file = e.target.files?.[0];
    if (!file || !activeUser) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const resp = await api.upload('/chat/upload', formData);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      const ws = socketRef.current || socket;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        showNotice('Unable to send media right now. Chat is reconnecting.', 'error');
        return;
      }
      ws.send(JSON.stringify({ type: 'chat', to: activeUser.id, message_type: type, media_url: resp.url, text: '' }));
      scrollToBottom();
    } catch (err) {
      console.error(err);
      showNotice('Media upload failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
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
    selectConversation(targetUser);
  };

  const handleReport = () => {
    showNotice("Message reported successfully.", "success");
    setActiveMenuId(null);
  };


  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const updateConversationMeta = ({ userId, previewText, timestamp, incrementUnread = false }) => {
    setConversations((prev) => {
      const existing = prev.find((c) => sameId(c.id, userId));
      if (!existing) return prev;

      const next = prev.map((contact) =>
        sameId(contact.id, userId)
          ? {
              ...contact,
              lastMessage: previewText || contact.lastMessage,
              lastMessageAt: timestamp || contact.lastMessageAt,
              unreadCount: incrementUnread ? (contact.unreadCount || 0) + 1 : contact.unreadCount || 0,
            }
          : contact
      );

      next.sort((a, b) => {
        const aTs = a.lastMessageAt || '';
        const bTs = b.lastMessageAt || '';
        return bTs.localeCompare(aTs);
      });
      return next;
    });
  };

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el || !activeUser) return;
    const nearTopThreshold = 120;
    if (el.scrollTop <= nearTopThreshold && hasMoreMessages && !isFetchingOlderMessages && oldestMessageCursor) {
      fetchMessages(activeUser.id, {
        before: oldestMessageCursor,
        appendOlder: true,
      });
    }
  };

  const timelineItems = useMemo(() => {
    return messages.reduce((items, m, index) => {
      const systemNotice = getSystemCallNotice(m, currUserId, activeUser?.username, messages.slice(0, index));
      if (m.message_type === 'system' && !systemNotice?.show) {
        return items;
      }

      const previous = index > 0 ? messages[index - 1] : null;
      const next = index < messages.length - 1 ? messages[index + 1] : null;
      const currentDate = toDate(m.time);
      const previousDate = previous ? toDate(previous.time) : null;
      const nextDate = next ? toDate(next.time) : null;

      const closeToPrevious = previousDate && currentDate && Math.abs(currentDate.getTime() - previousDate.getTime()) <= GROUP_WINDOW_MS;
      const closeToNext = nextDate && currentDate && Math.abs(currentDate.getTime() - currentDate.getTime()) <= GROUP_WINDOW_MS;

      const groupedWithPrevious = !!previous && previous.from === m.from && isSameDay(previous.time, m.time) && closeToPrevious;
      const groupedWithNext = !!next && next.from === m.from && isSameDay(next.time, m.time) && closeToNext;

      items.push({
        message: m,
        key: getMessageKey(m, index),
        showDateSeparator: !previous || !isSameDay(previous.time, m.time),
        dateLabel: getDateSeparatorLabel(m.time),
        groupedWithPrevious,
        groupedWithNext,
        systemNotice,
      });

      return items;
    }, []);
  }, [activeUser?.username, currUserId, messages]);

  const theme = {
    pageBg: 'var(--bg-color)',
    panelBg: 'rgba(6, 6, 6, 0.9)',
    panelBgStrong: 'rgba(10, 10, 10, 0.96)',
    panelMuted: 'rgba(255, 255, 255, 0.03)',
    panelSoft: 'rgba(255, 255, 255, 0.05)',
    panelMid: 'rgba(255, 255, 255, 0.08)',
    border: 'var(--card-border)',
    borderSoft: 'rgba(255, 255, 255, 0.12)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    text: 'var(--text-primary)',
    textMuted: 'var(--text-secondary)',
    textSoft: '#d5f8ff',
    accent: 'var(--accent-color)',
    accentGradient: 'var(--accent-gradient)',
    accentSoft: 'rgba(0, 242, 254, 0.12)',
    accentStrong: 'rgba(0, 242, 254, 0.24)',
    accentTextDark: '#021214',
    success: 'var(--success-color)',
    danger: 'var(--error-color)',
    dangerSoft: 'rgba(255, 51, 102, 0.14)',
    dangerStrong: 'rgba(255, 51, 102, 0.28)',
    dangerText: '#ffd0dc',
    warning: '#fbbf24',
    overlay: 'rgba(0,0,0,0.8)',
  };

  const callStatusLabel = callState === CALL_STATE.RINGING
    ? `${callParticipant?.username || 'Someone'} is calling you...`
    : callState === CALL_STATE.DIALING
      ? `Calling ${callParticipant?.username || '...'}`
      : callState === CALL_STATE.CONNECTING
        ? `Connecting to ${callParticipant?.username || '...'}`
        : callState === CALL_STATE.ACTIVE
          ? `In ${callMode} call with ${callParticipant?.username || 'participant'}`
          : callState === CALL_STATE.FAILED
            ? `Call failed`
            : callState === CALL_STATE.ENDED
              ? `Call ended`
              : '';

  return (
    <div style={{ height: isPhoneViewport ? 'calc(100dvh - 72px)' : '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: theme.pageBg, color: theme.text }}>
      <style>{`
        .sidebarScroll::-webkit-scrollbar, .chatScroll::-webkit-scrollbar { width: 6px; }
        .sidebarScroll::-webkit-scrollbar-thumb, .chatScroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 9999px; }
        .sidebarScroll:hover::-webkit-scrollbar-thumb, .chatScroll:hover::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.16); }
      `}</style>
      
      <div
        className="messages-layout"
        style={{
          width: '100%',
          height: isPhoneViewport ? 'calc(100dvh - 72px)' : '100dvh',
          display: 'grid',
          gridTemplateColumns: isPhoneViewport ? '1fr' : `${isTabletViewport ? '280px' : 'minmax(280px, 320px)'} minmax(0, 1fr)`,
          overflow: 'hidden'
        }}
      >
        {showConversationPane && (
          <ConversationList 
            conversations={conversations}
            activeUser={activeUser}
            setActiveUser={selectConversation}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onlineUsers={onlineUsers}
            formatConversationTime={formatConversationTime}
            theme={theme}
            t={t}
          />
        )}

        {(!isPhoneViewport || activeUser) && (
        <main style={{ borderLeft: isPhoneViewport ? 'none' : `1px solid ${theme.borderSoft}`, background: theme.panelBgStrong, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {activeUser ? (
            <>
              <div style={{ padding: isPhoneViewport ? '14px 14px' : '22px 26px', borderBottom: `1px solid ${theme.borderSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {isPhoneViewport && (
                    <button
                      type="button"
                      onClick={() => navigate('/messages', { replace: true })}
                      style={{ width: 40, height: 40, borderRadius: 14, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      aria-label="Back to chats"
                    >
                      <ArrowLeft size={18} />
                    </button>
                  )}
                  <Avatar user={activeUser} size={52} onlineUsers={onlineUsers} />
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: isPhoneViewport ? 18 : 24, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeUser.username}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: Array.from(onlineUsers).some((id) => sameId(id, activeUser.id)) ? theme.success : theme.textMuted }}>
                      {Array.from(onlineUsers).some((id) => sameId(id, activeUser.id)) ? 'Active now' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: isPhoneViewport ? 6 : 10, flexShrink: 0 }}>
                  <button onClick={() => startCall('audio')} disabled={callState !== CALL_STATE.IDLE} style={{ width: 44, height: 44, borderRadius: 16, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: callState === CALL_STATE.IDLE ? 'pointer' : 'not-allowed', opacity: callState === CALL_STATE.IDLE ? 1 : 0.5 }}>
                    <Phone size={18} />
                  </button>
                  <button onClick={() => startCall('video')} disabled={callState !== CALL_STATE.IDLE} style={{ width: 44, height: 44, borderRadius: 16, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: callState === CALL_STATE.IDLE ? 'pointer' : 'not-allowed', opacity: callState === CALL_STATE.IDLE ? 1 : 0.5 }}>
                    <Video size={18} />
                  </button>
                  <button style={{ width: 44, height: 44, borderRadius: 16, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer' }}>
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>

              {callError && (
                <div style={{ margin: '12px 26px 0', padding: '10px 14px', borderRadius: 14, background: theme.dangerSoft, border: `1px solid ${theme.dangerStrong}`, color: theme.dangerText, fontSize: 13 }}>
                  {callError}
                </div>
              )}
              {Array.from(typingUsers).some((id) => sameId(id, activeUser.id)) && (
                <div style={{ margin: '10px 26px 0', color: theme.textMuted, fontSize: 12 }}>
                  {activeUser.username} is typing...
                </div>
              )}

              <MessageList 
                chatScrollRef={chatScrollRef}
                handleChatScroll={handleChatScroll}
                isFetchingOlderMessages={isFetchingOlderMessages}
                timelineItems={timelineItems}
                currUserId={currUserId}
                activeUser={activeUser}
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
                messagesEndRef={messagesEndRef}
              />

              <MessageInput 
                sendMessage={sendMessage}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                showEmojiPicker={showEmojiPicker}
                setShowEmojiPicker={setShowEmojiPicker}
                emojiSearch={emojiSearch}
                setEmojiSearch={setEmojiSearch}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                handleTyping={handleTyping}
                toggleRecording={toggleRecording}
                isRecording={isRecording}
                fileInputRef={fileInputRef}
                handleMediaUpload={handleMediaUpload}
                theme={theme}
                activeUser={activeUser}
                currUserId={currUserId}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px' }}>
              <MessageCircle size={96} style={{ color: theme.accent }} />
              <h2 style={{ fontSize: 32 }}>Pick a chat</h2>
              <p style={{ color: theme.textMuted }}>Select a contact from the left.</p>
            </div>
          )}
        </main>
        )}
      </div>

      <CallOverlay 
        callState={callState}
        isCallMinimized={isCallMinimized}
        setIsCallMinimized={setIsCallMinimized}
        callParticipant={callParticipant}
        callStatusLabel={callStatusLabel}
        callMode={callMode}
        remoteVideoRef={remoteVideoRef}
        localVideoRef={localVideoRef}
        remoteAudioRef={remoteAudioRef}
        callDuration={callDuration}
        isCameraEnabled={isCameraEnabled}
        inputLevel={inputLevel}
        callQuality={callQuality}
        selectedAudioInputId={selectedAudioInputId}
        setSelectedAudioInputId={setSelectedAudioInputId}
        selectedAudioOutputId={selectedAudioOutputId}
        setSelectedAudioOutputId={setSelectedAudioOutputId}
        selectedVideoInputId={selectedVideoInputId}
        setSelectedVideoInputId={setSelectedVideoInputId}
        availableDevices={availableDevices}
        permissionError={permissionError}
        isReconnectingSocket={isReconnectingSocket}
        attemptManualReconnect={attemptManualReconnect}
        declineIncomingCall={declineIncomingCall}
        acceptIncomingCall={acceptIncomingCall}
        toggleMute={toggleMute}
        isMuted={isMuted}
        toggleCamera={toggleCamera}
        switchCamera={switchCamera}
        toggleLowBandwidthMode={toggleLowBandwidthMode}
        isLowBandwidth={isLowBandwidth}
        endCall={endCall}
        theme={theme}
        onlineUsers={onlineUsers}
      />

      <AnimatePresence>
        {forwardingMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', inset: 0, background: theme.overlay, zIndex: 100, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 400, background: theme.panelBgStrong, borderRadius: 28, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3>Forward</h3>
                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setForwardingMessage(null)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
                {conversations.map(user => (
                  <button 
                    key={user.id} 
                    onClick={() => handleForward(user, forwardingMessage.text)} 
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: theme.panelMuted, border: 'none', color: theme.text, cursor: 'pointer' }}
                  >
                    <Avatar user={user} size={36} onlineUsers={onlineUsers} />
                    <span>{user.username}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMedia && (
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
        )}
      </AnimatePresence>
    </div>
  );
}

export default Messages;
