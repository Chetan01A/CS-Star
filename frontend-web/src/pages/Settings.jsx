import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { buildAssetUrl } from '../config';
import {
  User,
  Bell,
  Settings as SettingsIcon,
  Star,
  Ban,
  MapPinOff,
  Send,
  AtSign,
  Heart,
  RefreshCw,
  EyeOff,
  MessageCircle,
  Palette,
  Check,
  Loader2,
  X,
} from 'lucide-react';

const settingsSections = [
  { id: 'edit-profile', label: 'Edit profile', icon: User, group: 'How you use CS-Star' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'How you use CS-Star' },
  { id: 'privacy', label: 'Account privacy', icon: SettingsIcon, group: 'Who can see your content' },
  { id: 'close-friends', label: 'Close friends', icon: Star, group: 'Who can see your content' },
  { id: 'blocked', label: 'Blocked', icon: Ban, group: 'Who can see your content' },
  { id: 'story-location', label: 'Story, live and location', icon: MapPinOff, group: 'Who can see your content' },
  { id: 'messages', label: 'Messages and story replies', icon: Send, group: 'How others can interact with you' },
  { id: 'tags-mentions', label: 'Tags and mentions', icon: AtSign, group: 'How others can interact with you' },
  { id: 'comments', label: 'Comments', icon: Heart, group: 'How others can interact with you' },
  { id: 'sharing-reuse', label: 'Sharing and reuse', icon: RefreshCw, group: 'How others can interact with you' },
  { id: 'restricted-accounts', label: 'Restricted accounts', icon: EyeOff, group: 'How others can interact with you' },
  { id: 'hidden-words', label: 'Hidden words', icon: MessageCircle, group: 'How others can interact with you' },
  { id: 'muted-accounts', label: 'Muted accounts', icon: EyeOff, group: 'What you see' },
  { id: 'preferences', label: 'Content preferences', icon: Palette, group: 'What you see' },
];

/* ─── Toggle card (used in almost every panel) ─── */
const ToggleCard = ({ title, description, enabled, onToggle, actionLabel, saving }) => (
  <div className="glass" style={{ padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
    <div>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{title}</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{description}</p>
    </div>
    <button
      onClick={onToggle}
      disabled={saving}
      className={enabled ? 'btn-primary' : 'glass'}
      style={{ minWidth: '92px', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: saving ? 0.6 : 1 }}
    >
      {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
      {actionLabel || (enabled ? 'ON' : 'OFF')}
    </button>
  </div>
);

/* ─── Toast notification ─── */
const Toast = ({ message, visible }) => (
  <div
    style={{
      position: 'fixed', bottom: visible ? '32px' : '-60px', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, #00c853, #00e676)', color: '#000', padding: '12px 28px',
      borderRadius: '14px', fontWeight: 700, fontSize: '0.95rem', zIndex: 9999,
      transition: 'bottom 0.35s cubic-bezier(.4,0,.2,1)', boxShadow: '0 8px 32px rgba(0,200,83,.35)',
      display: 'flex', alignItems: 'center', gap: '8px',
    }}
  >
    <Check size={16} /> {message}
  </div>
);

function Settings() {
  const [activeSection, setActiveSection] = useState('edit-profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const fileInputRef = useRef(null);

  // ─── Settings state (mirrors backend) ───
  const [settings, setSettings] = useState({
    website: '',
    bio: '',
    gender: 'Prefer not to say',
    show_threads_badge: true,
    show_profile_suggestions: true,
    push_notifications: true,
    account_private: false,
    close_friends_enabled: false,
    story_location_sharing: false,
    message_replies: true,
    tags_mentions: true,
    sharing_reuse: true,
    restricted_accounts: false,
    hidden_words: true,
    muted_accounts: false,
    autoplay_reels: true,
    appearance_mode: 'dark',
  });

  // Profile info for the header card
  const [profileInfo, setProfileInfo] = useState({ username: '', name: '', profile_pic: '' });
  const [blockedUsers, setBlockedUsers] = useState([]);

  // ─── Helpers ───
  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2200);
  };

  const userId = (() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.user_id || payload.id;
    } catch { return null; }
  })();

  // ─── Load settings on mount ───
  useEffect(() => {
    const load = async () => {
      try {
        const [settingsData, profileData] = await Promise.all([
          api.get('/settings/'),
          userId ? api.get(`/profile/${userId}`) : Promise.resolve(null),
        ]);
        if (settingsData) setSettings(settingsData);
        if (profileData) {
          setProfileInfo({
            username: profileData.username || '',
            name: profileData.username || '',
            profile_pic: profileData.profile_pic || '',
          });
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  // Load blocked users when that section is viewed
  useEffect(() => {
    if (activeSection === 'blocked') {
      api.get('/settings/blocked').then((data) => {
        if (data?.blocked) setBlockedUsers(data.blocked);
      }).catch(console.error);
    }
  }, [activeSection]);

  // ─── Persist a single field change ───
  const updateSetting = async (key, value) => {
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    setSaving(true);
    try {
      await api.put('/settings/', { [key]: value });
      showToast('Setting saved');
    } catch (e) {
      console.error('Save failed', e);
      setSettings((s) => ({ ...s, [key]: prev }));
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => updateSetting(key, !settings[key]);

  // ─── Save profile (bio, website, gender) ───
  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.put('/settings/', {
        bio: settings.bio,
        website: settings.website,
        gender: settings.gender,
      });
      showToast('Profile updated');
    } catch (e) {
      console.error('Profile save failed', e);
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ─── Photo upload ───
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const formData = new FormData();
    formData.append('file', file);
    setSaving(true);
    try {
      const data = await api.upload(`/profile/${userId}/photo`, formData);
      if (data?.profile_pic) {
        setProfileInfo((p) => ({ ...p, profile_pic: data.profile_pic }));
      }
      showToast('Photo updated');
    } catch (e) {
      console.error('Photo upload failed', e);
      showToast('Upload failed');
    } finally {
      setSaving(false);
    }
  };

  // ─── Unblock ───
  const handleUnblock = async (id) => {
    try {
      await api.fetch(`/settings/block/${id}`, { method: 'DELETE' });
      setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
      showToast('User unblocked');
    } catch (e) {
      console.error('Unblock failed', e);
    }
  };

  const groups = Array.from(new Set(settingsSections.map((s) => s.group)));

  if (loading) {
    return (
      <div style={{ padding: '24px 28px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>
      <Toast message={toast.message} visible={toast.visible} />

      <div className="glass" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', minHeight: 'calc(100vh - 48px)', overflow: 'hidden' }}>
        {/* ─── SIDEBAR ─── */}
        <div style={{ borderRight: '1px solid var(--card-border)', padding: '26px 18px', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 26px', fontSize: '1.4rem' }}>Settings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {groups.map((group) => (
              <div key={group}>
                <p style={{ margin: '0 0 10px', color: '#c8b07a', fontSize: '0.84rem', fontWeight: 600 }}>{group}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {settingsSections.filter((s) => s.group === group).map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                          padding: '14px 16px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                          background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                          color: 'white', textAlign: 'left', fontSize: '0.98rem', fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        <Icon size={18} />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CONTENT PANELS ─── */}
        <div style={{ padding: '28px 34px', overflowY: 'auto' }}>

          {/* ══════ EDIT PROFILE ══════ */}
          {activeSection === 'edit-profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Edit profile</h3>

              {/* Avatar card */}
              <div className="glass" style={{ padding: '16px 18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  {profileInfo.profile_pic ? (
                    <img
                      src={buildAssetUrl(profileInfo.profile_pic)}
                      alt="avatar"
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {(profileInfo.username || 'U').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{profileInfo.username}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{profileInfo.name}</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                <button className="btn-primary" style={{ borderRadius: '12px' }} onClick={() => fileInputRef.current?.click()}>
                  CHANGE PHOTO
                </button>
              </div>

              {/* Website */}
              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Website</p>
                <input
                  className="input-field"
                  placeholder="Website"
                  value={settings.website}
                  onChange={(e) => setSettings((s) => ({ ...s, website: e.target.value }))}
                />
              </div>

              {/* Bio */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Bio</p>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{(settings.bio || '').length} / 150</span>
                </div>
                <textarea
                  className="input-field"
                  placeholder="Bio"
                  style={{ minHeight: '110px', resize: 'none' }}
                  maxLength={150}
                  value={settings.bio}
                  onChange={(e) => setSettings((s) => ({ ...s, bio: e.target.value }))}
                />
              </div>

              {/* Show Threads badge */}
              <ToggleCard
                title="Show Threads badge"
                description="Display an extra badge under your profile details."
                enabled={settings.show_threads_badge}
                onToggle={() => toggleSetting('show_threads_badge')}
                saving={saving}
              />

              {/* Gender */}
              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Gender</p>
                <select
                  className="input-field"
                  value={settings.gender}
                  onChange={(e) => setSettings((s) => ({ ...s, gender: e.target.value }))}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
                <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>This will not be part of your public profile.</p>
              </div>

              {/* Show account suggestions */}
              <ToggleCard
                title="Show account suggestions on profiles"
                description="Let similar profile suggestions appear for people who view your account."
                enabled={settings.show_profile_suggestions}
                onToggle={() => toggleSetting('show_profile_suggestions')}
                saving={saving}
              />

              {/* Save button for text fields */}
              <button
                className="btn-primary"
                disabled={saving}
                onClick={saveProfile}
                style={{ padding: '14px 0', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                Save Profile
              </button>
            </div>
          )}

          {/* ══════ NOTIFICATIONS ══════ */}
          {activeSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Notifications</h3>
              <ToggleCard
                title="Push notifications"
                description="Control likes, comments, mentions and message alerts."
                enabled={settings.push_notifications}
                onToggle={() => toggleSetting('push_notifications')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ ACCOUNT PRIVACY ══════ */}
          {activeSection === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Account privacy</h3>
              <ToggleCard
                title="Private account"
                description="Only approved followers can see your posts and videos."
                enabled={settings.account_private}
                onToggle={() => toggleSetting('account_private')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ CLOSE FRIENDS ══════ */}
          {activeSection === 'close-friends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Close friends</h3>
              <ToggleCard
                title="Close friends list"
                description="Share stories and notes with a smaller trusted circle."
                enabled={settings.close_friends_enabled}
                onToggle={() => toggleSetting('close_friends_enabled')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ BLOCKED ══════ */}
          {activeSection === 'blocked' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Blocked</h3>
              {blockedUsers.length === 0 ? (
                <div className="glass" style={{ padding: '28px', borderRadius: '20px', textAlign: 'center' }}>
                  <Ban size={36} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>You haven't blocked anyone yet.</p>
                </div>
              ) : (
                blockedUsers.map((u) => (
                  <div key={u.id} className="glass" style={{ padding: '14px 18px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {u.profile_pic ? (
                        <img src={buildAssetUrl(u.profile_pic)} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {(u.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600 }}>{u.username}</span>
                    </div>
                    <button className="glass" onClick={() => handleUnblock(u.id)} style={{ padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <X size={14} /> Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ══════ STORY, LIVE & LOCATION ══════ */}
          {activeSection === 'story-location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Story, live and location</h3>
              <ToggleCard
                title="Location and story sharing"
                description="Control location sharing and who can interact with your live and story content."
                enabled={settings.story_location_sharing}
                onToggle={() => toggleSetting('story_location_sharing')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ MESSAGES & STORY REPLIES ══════ */}
          {activeSection === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Messages and replies</h3>
              <ToggleCard
                title="Story replies and messages"
                description="Choose who can reply to your stories and send direct messages."
                enabled={settings.message_replies}
                onToggle={() => toggleSetting('message_replies')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ TAGS & MENTIONS ══════ */}
          {activeSection === 'tags-mentions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Tags and mentions</h3>
              <ToggleCard
                title="Tags and mentions controls"
                description="Decide who can tag you and mention you in posts, captions, and comments."
                enabled={settings.tags_mentions}
                onToggle={() => toggleSetting('tags_mentions')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ COMMENTS ══════ */}
          {activeSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Comments</h3>
              <ToggleCard
                title="Comment controls"
                description="Manage filters, mentions, replies, and who can comment on your posts."
                enabled onToggle={() => {}} actionLabel="Manage"
              />
            </div>
          )}

          {/* ══════ SHARING & REUSE ══════ */}
          {activeSection === 'sharing-reuse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Sharing and reuse</h3>
              <ToggleCard
                title="Allow sharing and reuse"
                description="Choose whether others can share your content to stories or reuse it."
                enabled={settings.sharing_reuse}
                onToggle={() => toggleSetting('sharing_reuse')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ RESTRICTED ACCOUNTS ══════ */}
          {activeSection === 'restricted-accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Restricted accounts</h3>
              <ToggleCard
                title="Restrictions"
                description="Limit interactions from accounts without fully blocking them."
                enabled={settings.restricted_accounts}
                onToggle={() => toggleSetting('restricted_accounts')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ HIDDEN WORDS ══════ */}
          {activeSection === 'hidden-words' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Hidden words</h3>
              <ToggleCard
                title="Filter offensive words"
                description="Hide messages, comments, and requests that may contain offensive content."
                enabled={settings.hidden_words}
                onToggle={() => toggleSetting('hidden_words')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ MUTED ACCOUNTS ══════ */}
          {activeSection === 'muted-accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Muted accounts</h3>
              <ToggleCard
                title="Muted accounts list"
                description="Manage accounts whose posts, stories, or notes you have muted."
                enabled={settings.muted_accounts}
                onToggle={() => toggleSetting('muted_accounts')}
                saving={saving}
              />
            </div>
          )}

          {/* ══════ CONTENT PREFERENCES ══════ */}
          {activeSection === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Content preferences</h3>
              <ToggleCard
                title="Autoplay reels"
                description="Choose whether videos should start automatically."
                enabled={settings.autoplay_reels}
                onToggle={() => toggleSetting('autoplay_reels')}
                saving={saving}
              />
              <div className="glass" style={{ padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Appearance</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Switch your viewing style.</p>
                </div>
                <select
                  value={settings.appearance_mode}
                  onChange={(e) => updateSetting('appearance_mode', e.target.value)}
                  className="input-field"
                  style={{ width: '180px', padding: '10px 12px' }}
                >
                  <option value="dark">Dark</option>
                  <option value="midnight">Midnight</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default Settings;
