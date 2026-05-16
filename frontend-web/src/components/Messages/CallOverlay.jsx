import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, AlertTriangle, RefreshCcw, PhoneOff, Phone, MicOff, Mic, VideoOff, Video, Gauge, Maximize2 } from 'lucide-react';
import Avatar from './Avatar';
import { CALL_STATE } from './constants';

const CallOverlay = ({
  callState,
  isCallMinimized,
  setIsCallMinimized,
  callParticipant,
  callStatusLabel,
  callMode,
  remoteVideoRef,
  localVideoRef,
  remoteAudioRef,
  callDuration,
  isCameraEnabled,
  inputLevel,
  callQuality,
  selectedAudioInputId,
  setSelectedAudioInputId,
  selectedAudioOutputId,
  setSelectedAudioOutputId,
  selectedVideoInputId,
  setSelectedVideoInputId,
  availableDevices,
  permissionError,
  isReconnectingSocket,
  attemptManualReconnect,
  declineIncomingCall,
  acceptIncomingCall,
  toggleMute,
  isMuted,
  toggleCamera,
  switchCamera,
  toggleLowBandwidthMode,
  isLowBandwidth,
  endCall,
  theme,
  onlineUsers,
}) => {
  return (
    <>
      <AnimatePresence>
        {callState !== CALL_STATE.IDLE && !isCallMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'grid', placeItems: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0 }}
              style={{ width: '100%', maxWidth: 440, background: theme.panelBgStrong, borderRadius: 28, border: `1px solid ${theme.borderStrong}`, padding: 24, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', position: 'relative' }}
            >
              <button
                type="button"
                onClick={() => setIsCallMinimized(true)}
                style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 14, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
              >
                <Minimize2 size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar user={callParticipant} size={56} onlineUsers={onlineUsers} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 22 }}>{callParticipant?.username || 'Call'}</h3>
                    <p style={{ margin: '4px 0 0', color: theme.textMuted, fontSize: 14 }}>{callStatusLabel}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: callMode === 'video' ? '1fr 160px' : '1fr', gap: 12 }}>
                <div style={{ minHeight: 220, borderRadius: 20, border: `1px solid ${theme.borderStrong}`, background: theme.panelBg, overflow: 'hidden', position: 'relative' }}>
                  {callMode === 'video' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                      <Avatar user={callParticipant} size={84} onlineUsers={onlineUsers} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', padding: '8px 14px', borderRadius: 999, background: theme.panelBg, border: `1px solid ${theme.borderStrong}`, color: theme.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.03em', backdropFilter: 'blur(8px)' }}>
                    {callDuration > 0 ? `${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}` : '00:00'}
                  </div>
                  <audio ref={remoteAudioRef} autoPlay playsInline />
                </div>
                {callMode === 'video' && (
                  <div style={{ minHeight: 220, borderRadius: 20, border: `1px solid ${theme.borderStrong}`, background: theme.panelBg, overflow: 'hidden', position: 'relative' }}>
                    <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    {!isCameraEnabled && (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.5)', color: theme.textMuted, fontSize: 12 }}>
                        Camera Off
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: theme.panelMid, fontSize: 12 }}>
                  Mic Input: <strong>{inputLevel}%</strong>
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 12, background: theme.panelMid, fontSize: 12 }}>
                  Bitrate: <strong>{callQuality.bitrateKbps} kbps</strong>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <select value={selectedAudioInputId} onChange={(e) => setSelectedAudioInputId(e.target.value)} style={{ width: '100%', background: theme.panelSoft, color: theme.text, border: `1px solid ${theme.borderStrong}`, borderRadius: 10, padding: '10px 12px' }}>
                  {availableDevices.audioInput.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Mic device'}</option>)}
                </select>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))', gap: 10 }}>
                  <select value={selectedAudioOutputId} onChange={(e) => setSelectedAudioOutputId(e.target.value)} style={{ width: '100%', minWidth: 0, background: theme.panelSoft, color: theme.text, border: `1px solid ${theme.borderStrong}`, borderRadius: 10, padding: '10px 12px' }}>
                    {availableDevices.audioOutput.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Speaker device'}</option>)}
                  </select>
                  <select value={selectedVideoInputId} onChange={(e) => setSelectedVideoInputId(e.target.value)} style={{ width: '100%', minWidth: 0, background: theme.panelSoft, color: theme.text, border: `1px solid ${theme.borderStrong}`, borderRadius: 10, padding: '10px 12px' }}>
                    {availableDevices.videoInput.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Camera device'}</option>)}
                  </select>
                </div>
              </div>

              {(permissionError || isReconnectingSocket) && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.28)', color: '#fde68a', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span><AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />{permissionError || 'Reconnecting call signaling...'}</span>
                  {isReconnectingSocket && <button type="button" onClick={attemptManualReconnect} style={{ border: '1px solid rgba(253, 230, 138, 0.4)', background: 'transparent', color: '#fde68a', borderRadius: 999, padding: '5px 10px', cursor: 'pointer' }}><RefreshCcw size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />Retry</button>}
                </div>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {callState === CALL_STATE.RINGING ? (
                  <>
                    <button type="button" onClick={declineIncomingCall} style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${theme.dangerStrong}`, background: theme.dangerSoft, color: theme.dangerText, cursor: 'pointer' }}>
                      <PhoneOff size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Decline
                    </button>
                    <button type="button" onClick={acceptIncomingCall} style={{ padding: '10px 16px', borderRadius: 999, border: '1px solid rgba(0, 255, 136, 0.3)', background: 'rgba(0, 255, 136, 0.12)', color: '#baffd8', cursor: 'pointer' }}>
                      <Phone size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Accept {callMode === 'video' ? 'Video' : 'Voice'}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={toggleMute} style={{ padding: '10px 12px', borderRadius: 999, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer' }}>
                      {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                    </button>
                    {callMode === 'video' && (
                      <>
                        <button type="button" onClick={toggleCamera} style={{ padding: '10px 12px', borderRadius: 999, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer' }}>
                          {isCameraEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                        </button>
                        <button type="button" onClick={switchCamera} style={{ padding: '10px 12px', borderRadius: 999, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer' }}>
                          <RefreshCcw size={14} />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={toggleLowBandwidthMode} style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${theme.accentStrong}`, background: isLowBandwidth ? theme.accentSoft : theme.panelSoft, color: theme.textSoft, cursor: 'pointer' }}>
                      <Gauge size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{isLowBandwidth ? 'Low BW On' : 'Low BW Off'}
                    </button>
                    <button type="button" onClick={endCall} style={{ padding: '10px 16px', borderRadius: 999, border: `1px solid ${theme.dangerStrong}`, background: theme.dangerSoft, color: theme.dangerText, cursor: 'pointer' }}>
                      <PhoneOff size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />End Call
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {callState !== CALL_STATE.IDLE && isCallMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1150, width: 'min(360px, calc(100vw - 32px))' }}
          >
            <div style={{ background: theme.panelBgStrong, border: `1px solid ${theme.borderStrong}`, borderRadius: 22, padding: 16, boxShadow: '0 22px 50px rgba(0,0,0,0.45)', backdropFilter: 'blur(10px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar user={callParticipant} size={44} onlineUsers={onlineUsers} />
                <button
                  type="button"
                  onClick={() => setIsCallMinimized(false)}
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', color: theme.text, textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{callParticipant?.username || 'Call'}</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{callStatusLabel}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCallMinimized(false)}
                  style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${theme.borderStrong}`, background: theme.panelSoft, color: theme.text, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={endCall}
                  style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${theme.dangerStrong}`, background: theme.dangerSoft, color: theme.dangerText, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                >
                  <PhoneOff size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallOverlay;
