import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, VideoOff, Maximize2, Minimize2, Minus, X, Mic } from 'lucide-react';

const CallStage = ({
  showCallOverlay,
  showMinimizedCall,
  incomingCall,
  callParticipant,
  callState,
  callMode,
  callDuration,
  isMuted,
  isCameraEnabled,
  isCallMinimized,
  isScreenSharing,
  remoteIsScreenSharing,
  isStageFullscreen,
  hasRemoteVideo,
  hasSharedScreen,
  hasLocalCameraPreview,
  localStream,
  remoteStream,
  localVideoRef,
  remoteVideoRef,
  stageVideoRef,
  stageContainerRef,
  callError,
  renderAvatar,
  formatDuration,
  getCallStatusLabel,
  effectiveCallMode,
  acceptIncomingCall,
  rejectIncomingCall,
  toggleMute,
  toggleCamera,
  cleanupCall,
  setIsCallMinimized,
  toggleStageFullscreen
}) => {
  const showPresentationStage = isScreenSharing || remoteIsScreenSharing;

  return (
    <>
      <AnimatePresence>
        {showCallOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 7, 23, 0.88)', backdropFilter: 'blur(16px)', zIndex: 1200, display: 'grid', placeItems: 'center', padding: 24 }}>
            <div style={{ width: 'min(920px, 100%)', background: 'linear-gradient(160deg, rgba(15,23,42,0.97), rgba(15,23,42,0.9))', border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 32, padding: 24, boxShadow: '0 30px 80px rgba(0,0,0,0.45)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                {showPresentationStage ? (
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 15 }}>{getCallStatusLabel()}</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {callParticipant && renderAvatar(callParticipant, 56)}
                    <div>
                      <h3 style={{ margin: 0, fontSize: 24 }}>{callParticipant?.username || 'Call'}</h3>
                      <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>{getCallStatusLabel()}</p>
                    </div>
                  </div>
                )}
                <button onClick={() => setIsCallMinimized(true)} style={{ width: 44, height: 44, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', cursor: 'pointer' }}>
                  <Minus size={18} />
                </button>
              </div>

              {showPresentationStage && (
                <div ref={stageContainerRef} style={{ minHeight: 460, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148, 163, 184, 0.14)', overflow: 'hidden', position: 'relative', marginBottom: 18 }}>
                  <video ref={stageVideoRef} autoPlay muted={!remoteIsScreenSharing} playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0b1120' }} />
                  <div style={{ position: 'absolute', top: 18, left: 18, padding: '8px 12px', borderRadius: 999, background: 'rgba(15, 23, 42, 0.82)', border: '1px solid rgba(148, 163, 184, 0.16)', color: '#dbeafe', fontSize: 13, fontWeight: 600 }}>
                    {hasSharedScreen ? 'Presenting your screen' : `${callParticipant?.username || 'Participant'} is presenting`}
                  </div>
                  {!hasSharedScreen && (
                    <button onClick={toggleStageFullscreen} style={{ position: 'absolute', top: 18, right: 18, width: 42, height: 42, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.16)', background: 'rgba(15, 23, 42, 0.82)', color: '#e2e8f0', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                      {isStageFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                    </button>
                  )}
                  <div style={{ position: 'absolute', top: 18, right: !hasSharedScreen ? 72 : 18, width: 220, height: 136, borderRadius: 22, overflow: 'hidden', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(148, 163, 184, 0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
                    {hasSharedScreen && hasRemoteVideo ? (
                      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          {callParticipant && renderAvatar(callParticipant, 56)}
                          <span style={{ fontSize: 13, color: '#cbd5e1' }}>{callParticipant?.username || 'Participant'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {hasLocalCameraPreview && (
                    <div style={{ position: 'absolute', right: 18, bottom: 18, width: 180, height: 112, borderRadius: 20, overflow: 'hidden', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148, 163, 184, 0.16)', boxShadow: '0 18px 40px rgba(0,0,0,0.25)' }}>
                      <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                    </div>
                  )}
                </div>
              )}

              {!showPresentationStage && (
                <div style={{ display: 'grid', gridTemplateColumns: effectiveCallMode === 'video' ? 'minmax(0, 1fr) 220px' : '1fr', gap: 18, alignItems: 'stretch' }}>
                  <div style={{ minHeight: 360, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148, 163, 184, 0.14)', display: 'grid', placeItems: 'center', overflow: 'hidden', position: 'relative' }}>
                    {hasRemoteVideo ? (
                      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        {callParticipant && renderAvatar(callParticipant, 112)}
                        <p style={{ margin: 0, color: '#cbd5e1', fontSize: 18 }}>
                          {callState === 'active' ? `Connected • ${formatDuration(callDuration)}` : incomingCall ? 'Waiting for your answer' : 'Waiting for connection'}
                        </p>
                      </div>
                    )}
                  </div>

                  {effectiveCallMode === 'video' && (
                    <div style={{ minHeight: 360, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148, 163, 184, 0.14)', overflow: 'hidden', position: 'relative', display: 'grid', placeItems: 'center' }}>
                      {localStream ? (
                        isCameraEnabled ? (
                          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        ) : (
                          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: '#94a3b8' }}>Camera off</div>
                        )
                      ) : (
                        <div style={{ color: '#94a3b8' }}>Camera preview</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 22, flexWrap: 'wrap' }}>
                {incomingCall ? (
                  <>
                    <button onClick={rejectIncomingCall} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(127,29,29,0.4)', color: '#fecaca', cursor: 'pointer' }}>
                      Decline
                    </button>
                    <button onClick={acceptIncomingCall} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(52,211,153,0.22)', background: 'rgba(6,95,70,0.45)', color: '#d1fae5', cursor: 'pointer' }}>
                      Accept {effectiveCallMode === 'video' ? 'Video' : 'Voice'}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={toggleMute} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.16)', background: isMuted ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Mic size={16} />{isMuted ? 'Unmute' : 'Mute'}</span>
                    </button>
                    <button onClick={toggleCamera} disabled={callState !== 'active' || isScreenSharing} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.16)', background: isCameraEnabled ? 'rgba(255,255,255,0.06)' : 'rgba(239,68,68,0.18)', color: '#e2e8f0', cursor: callState === 'active' && !isScreenSharing ? 'pointer' : 'not-allowed', opacity: callState === 'active' && !isScreenSharing ? 1 : 0.55 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{isCameraEnabled ? <Video size={16} /> : <VideoOff size={16} />}{isCameraEnabled ? 'Camera On' : 'Camera Off'}</span>
                    </button>
                    <button onClick={() => cleanupCall({ notify: true })} style={{ padding: '12px 18px', borderRadius: 999, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(127,29,29,0.4)', color: '#fecaca', cursor: 'pointer' }}>
                      End Call
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMinimizedCall && (
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1250 }}>
            <div style={{ minWidth: 300, maxWidth: 360, borderRadius: 24, background: 'rgba(15, 23, 42, 0.96)', border: '1px solid rgba(148, 163, 184, 0.18)', boxShadow: '0 24px 60px rgba(0,0,0,0.35)', padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              {callParticipant && renderAvatar(callParticipant, 46)}
              <button onClick={() => setIsCallMinimized(false)} style={{ flex: 1, background: 'none', border: 'none', color: '#e2e8f0', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{callParticipant?.username || 'Call'}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>{getCallStatusLabel()}</p>
              </button>
              <button onClick={() => setIsCallMinimized(false)} style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.18)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', cursor: 'pointer' }}>
                <Video size={16} />
              </button>
              <button onClick={() => cleanupCall({ notify: true })} style={{ width: 40, height: 40, borderRadius: 14, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(127,29,29,0.4)', color: '#fecaca', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CallStage;
