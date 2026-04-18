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
  Lock,
  Shield,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Search,
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

const SettingsNavCard = ({ title, description, onClick, value }) => (
  <button
    onClick={onClick}
    className="glass"
    style={{
      padding: '18px 20px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      width: '100%',
      color: 'white',
      cursor: 'pointer',
      border: '1px solid var(--card-border)',
      background: 'rgba(255,255,255,0.02)',
      textAlign: 'left',
    }}
  >
    <div>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{title}</p>
      {description ? (
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{description}</p>
      ) : null}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
      {value ? <span style={{ fontSize: '0.9rem' }}>{value}</span> : null}
      <ChevronRight size={18} />
    </div>
  </button>
);

const RadioOption = ({ label, selected, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
      background: 'transparent',
      border: 'none',
      color: 'white',
      textAlign: 'left',
      cursor: disabled ? 'default' : 'pointer',
      padding: '6px 0',
      opacity: disabled ? 0.7 : 1,
    }}
  >
    <span
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        border: '1.8px solid rgba(255,255,255,0.9)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {selected ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            display: 'block',
          }}
        />
      ) : null}
    </span>
    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{label}</span>
  </button>
);

const RadioCard = ({ options, selectedValue, onSelect, disabled }) => (
  <div
    className="glass"
    style={{
      borderRadius: '22px',
      overflow: 'hidden',
      border: '1px solid var(--card-border)',
    }}
  >
    {options.map((option, index) => (
      <button
        key={option.value}
        onClick={() => onSelect(option.value)}
        disabled={disabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'transparent',
          border: 'none',
          color: 'white',
          padding: '16px 18px',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          borderBottom: index === options.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{ fontSize: '1rem', fontWeight: 500, textAlign: 'left' }}>{option.label}</span>
        <span
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: '1.8px solid rgba(255,255,255,0.9)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {selectedValue === option.value ? (
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#fff',
                display: 'block',
              }}
            />
          ) : null}
        </span>
      </button>
    ))}
  </div>
);

const RadioListOption = ({ label, subtitle, selected, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '14px',
      width: '100%',
      background: 'transparent',
      border: 'none',
      color: 'white',
      textAlign: 'left',
      cursor: disabled ? 'default' : 'pointer',
      padding: '4px 0',
      opacity: disabled ? 0.7 : 1,
    }}
  >
    <span
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        border: '1.8px solid rgba(255,255,255,0.9)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px',
      }}
    >
      {selected ? (
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#fff',
            display: 'block',
          }}
        />
      ) : null}
    </span>
    <span style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontSize: '1rem', fontWeight: 500 }}>{label}</span>
      {subtitle ? <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{subtitle}</span> : null}
    </span>
  </button>
);

const SwitchRow = ({ label, checked, onToggle, disabled, bordered = false }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      padding: '16px 18px',
      borderBottom: bordered ? '1px solid rgba(255,255,255,0.05)' : 'none',
    }}
  >
    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{label}</p>
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: '42px',
        height: '24px',
        borderRadius: '999px',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: checked ? '#ffffff' : '#6b7280',
        position: 'relative',
        transition: 'background 0.2s ease',
        padding: 0,
        opacity: disabled ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#0f141a',
          transition: 'left 0.2s ease',
        }}
      />
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

/* ─── Privacy confirmation modal ─── */
const PrivacyConfirmModal = ({ visible, onConfirm, onCancel, saving }) => {
  if (!visible) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#262626', borderRadius: '20px', width: '100%', maxWidth: '460px',
          overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,.6)',
          animation: 'modalIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 24px', fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            Switch to private account?
          </h3>

          {/* Info bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={15} color="#fff" />
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#e0e0e0', lineHeight: 1.5 }}>
                Only your followers will be able to see your photos and videos.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={15} color="#fff" />
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#e0e0e0', lineHeight: 1.5 }}>
                This won't change who can message, tag or @mention you, but you won't be able to tag people who don't follow you.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ minWidth: '32px', height: '32px', borderRadius: '50%', border: '2px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={15} color="#0095f6" />
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#0095f6', lineHeight: 1.5 }}>
                No one can reuse your content. All reels, posts and stories that previously used your content in features like remixes, sequences, templates or stickers will be deleted. If you switch back to a public account within 24 hours, they will be restored.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ borderTop: '1px solid #363636' }}>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              width: '100%', padding: '16px', border: 'none', background: 'transparent',
              color: '#0095f6', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
              borderBottom: '1px solid #363636', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            Switch to private
          </button>
          <button
            onClick={onCancel}
            style={{
              width: '100%', padding: '16px', border: 'none', background: 'transparent',
              color: '#fff', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

function Settings() {
  const [activeSection, setActiveSection] = useState('edit-profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const fileInputRef = useRef(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [storyLocationView, setStoryLocationView] = useState('menu');
  const [messagesView, setMessagesView] = useState('menu');
  const [tagsView, setTagsView] = useState('menu');
  const [relationshipCounts, setRelationshipCounts] = useState({ followers: 0, following: 0 });
  const [storyAudience, setStoryAudience] = useState([]);
  const [storyAudienceLoading, setStoryAudienceLoading] = useState(false);
  const [storySearch, setStorySearch] = useState('');

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
    hidden_story_live_from: [],
    message_controls: true,
    message_request_audience: 'everyone',
    group_invite_audience: 'everyone',
    message_replies: true,
    story_reply_audience: 'everyone',
    show_activity_status: true,
    tags_mentions: true,
    tag_audience: 'everyone',
    mention_audience: 'everyone',
    manual_tag_approval: false,
    comment_audience: 'everyone',
    gif_comments_enabled: true,
    sharing_reuse: true,
    story_shares_enabled: true,
    posts_reels_to_stories_enabled: true,
    reposts_enabled: true,
    website_embeds_enabled: false,
    featured_content_requests_enabled: true,
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

  useEffect(() => {
    if (activeSection !== 'story-location') {
      setStoryLocationView('menu');
      setStorySearch('');
      return;
    }

    const loadStoryAudience = async () => {
      if (!userId) return;
      setStoryAudienceLoading(true);
      try {
        const data = await api.get(`/follow/followers/${userId}`);
        setStoryAudience(data?.followers || []);
      } catch (e) {
        console.error('Failed to load followers for story settings', e);
        setStoryAudience([]);
      } finally {
        setStoryAudienceLoading(false);
      }
    };

    loadStoryAudience();
  }, [activeSection, userId]);

  useEffect(() => {
    if (activeSection !== 'messages') {
      setMessagesView('menu');
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection !== 'tags-mentions') {
      setTagsView('menu');
    }
  }, [activeSection]);

  useEffect(() => {
    const loadRelationshipCounts = async () => {
      if (!userId) return;
      try {
        const [followersData, followingData] = await Promise.all([
          api.get(`/follow/followers-count/${userId}`),
          api.get(`/follow/following-count/${userId}`),
        ]);
        setRelationshipCounts({
          followers: followersData?.count || 0,
          following: followingData?.count || 0,
        });
      } catch (e) {
        console.error('Failed to load relationship counts', e);
      }
    };

    loadRelationshipCounts();
  }, [userId]);

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

  const toggleHiddenStoryUser = async (targetUserId) => {
    const currentList = Array.isArray(settings.hidden_story_live_from) ? settings.hidden_story_live_from : [];
    const nextList = currentList.includes(targetUserId)
      ? currentList.filter((id) => id !== targetUserId)
      : [...currentList, targetUserId];

    await updateSetting('hidden_story_live_from', nextList);
  };

  const setStoryReplyAudience = async (audience) => {
    await updateSetting('story_reply_audience', audience);
    await updateSetting('message_replies', audience !== 'off');
  };

  const setMessageRequestAudience = async (audience) => {
    await updateSetting('message_request_audience', audience);
    await updateSetting('message_controls', audience !== 'no-one');
  };

  const setGroupInviteAudience = async (audience) => {
    await updateSetting('group_invite_audience', audience);
  };

  const setTagAudience = async (audience) => {
    await updateSetting('tag_audience', audience);
    await updateSetting('tags_mentions', audience !== 'none');
  };

  const setMentionAudience = async (audience) => {
    await updateSetting('mention_audience', audience);
    await updateSetting('tags_mentions', audience !== 'none');
  };

  const setCommentAudience = async (audience) => {
    await updateSetting('comment_audience', audience);
  };

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
  const hiddenStoryIds = Array.isArray(settings.hidden_story_live_from) ? settings.hidden_story_live_from : [];
  const filteredStoryAudience = storyAudience.filter((user) => {
    const search = storySearch.trim().toLowerCase();
    if (!search) return true;
    return (user.username || '').toLowerCase().includes(search);
  });

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

              <div className="glass" style={{ padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Private account</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Only approved followers can see your posts and videos.</p>
                </div>
                {/* Toggle switch styled like Instagram */}
                <button
                  onClick={() => {
                    if (!settings.account_private) {
                      setShowPrivacyModal(true);
                    } else {
                      toggleSetting('account_private');
                    }
                  }}
                  style={{
                    width: '50px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    background: settings.account_private ? '#0095f6' : '#555',
                    position: 'relative', transition: 'background 0.25s ease', padding: 0,
                  }}
                >
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px',
                    left: settings.account_private ? '25px' : '3px',
                    transition: 'left 0.25s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,.3)',
                  }} />
                </button>
              </div>

              {settings.account_private && (
                <div className="glass" style={{ padding: '18px', borderRadius: '20px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    When your account is private, only people you approve can see your photos and videos on CS-Star. Your existing followers won't be affected.
                  </p>
                </div>
              )}

              {!settings.account_private && (
                <div className="glass" style={{ padding: '18px', borderRadius: '20px' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                    When your account is public, your profile and posts can be seen by anyone, on or off CS-Star, even if they don't have a CS-Star account. Certain info on your profile, like your name and profile photo, is visible to everyone.
                  </p>
                </div>
              )}

              <PrivacyConfirmModal
                visible={showPrivacyModal}
                saving={saving}
                onConfirm={async () => {
                  await toggleSetting('account_private');
                  setShowPrivacyModal(false);
                }}
                onCancel={() => setShowPrivacyModal(false)}
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
              {storyLocationView === 'menu' ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Story, live and location</h3>
                  <SettingsNavCard
                    title="Hide story and live from"
                    value={hiddenStoryIds.length ? `${hiddenStoryIds.length} selected` : ''}
                    onClick={() => setStoryLocationView('hide-story')}
                  />
                  <ToggleCard
                    title="Location sharing"
                    description="Choose whether location details can be attached to your story activity."
                    enabled={settings.story_location_sharing}
                    onToggle={() => toggleSetting('story_location_sharing')}
                    saving={saving}
                  />
                  <ToggleCard
                    title="Story replies"
                    description="Control whether people can reply to your stories and live updates."
                    enabled={settings.message_replies}
                    onToggle={() => toggleSetting('message_replies')}
                    saving={saving}
                  />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setStoryLocationView('menu')}
                      style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Hide story from</h3>
                  </div>

                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '720px' }}>
                    Hide all photos and videos you add to your story from specific people. This also hides your live videos.
                  </p>

                  <div
                    className="glass"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '14px 16px',
                      borderRadius: '18px',
                    }}
                  >
                    <Search size={18} color="var(--text-secondary)" />
                    <input
                      value={storySearch}
                      onChange={(e) => setStorySearch(e.target.value)}
                      placeholder="Search"
                      style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'white',
                        fontSize: '1rem',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {storyAudienceLoading ? (
                      <div className="glass" style={{ padding: '22px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : filteredStoryAudience.length === 0 ? (
                      <div className="glass" style={{ padding: '22px', borderRadius: '18px', color: 'var(--text-secondary)' }}>
                        {storySearch.trim() ? 'No matching followers found.' : 'No followers available yet.'}
                      </div>
                    ) : (
                      filteredStoryAudience.map((user) => {
                        const isHidden = hiddenStoryIds.includes(user.id);
                        return (
                          <button
                            key={user.id}
                            onClick={() => toggleHiddenStoryUser(user.id)}
                            disabled={saving}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '16px',
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              color: 'white',
                              padding: '10px 2px',
                              cursor: saving ? 'default' : 'pointer',
                              opacity: saving ? 0.7 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                              {user.profile_pic ? (
                                <img
                                  src={buildAssetUrl(user.profile_pic)}
                                  alt={user.username}
                                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'var(--accent-gradient)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                  }}
                                >
                                  {(user.username || 'U').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>{user.username}</p>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                                  {isHidden ? 'Hidden from your story and live' : 'Can see your story and live'}
                                </p>
                              </div>
                            </div>

                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                border: `2px solid ${isHidden ? '#0095f6' : 'rgba(255,255,255,0.2)'}`,
                                background: isHidden ? '#0095f6' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {isHidden ? <Check size={14} color="#fff" /> : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════ MESSAGES & STORY REPLIES ══════ */}
          {activeSection === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {messagesView === 'menu' ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Messages and story replies</h3>

                  <p style={{ margin: '10px 0 6px', fontSize: '1.45rem', fontWeight: 800 }}>
                    How people can reach you
                  </p>

                  <div className="glass" style={{ borderRadius: '22px', overflow: 'hidden', padding: '8px 0' }}>
                    <button
                      onClick={() => setMessagesView('message-controls')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        padding: '16px 18px',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      <span>Message controls</span>
                      <ChevronRight size={18} color="var(--text-secondary)" />
                    </button>

                    <button
                      onClick={() => setMessagesView('story-replies')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        padding: '16px 18px',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      <span>Story replies</span>
                      <ChevronRight size={18} color="var(--text-secondary)" />
                    </button>
                  </div>

                  <p style={{ margin: '34px 0 6px', fontSize: '1.45rem', fontWeight: 800 }}>
                    Who can see you're online
                  </p>

                  <div className="glass" style={{ borderRadius: '22px', overflow: 'hidden', padding: '8px 0' }}>
                    <button
                      onClick={() => setMessagesView('activity-status')}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        padding: '16px 18px',
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      <span>Show activity status</span>
                      <ChevronRight size={18} color="var(--text-secondary)" />
                    </button>
                  </div>
                </>
              ) : messagesView === 'message-controls' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setMessagesView('menu')}
                      style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Message requests</h3>
                  </div>

                  <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '34px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        When someone who you don't follow or haven't chatted with before sends you a message, you receive it as a message request.
                      </p>
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6ea8ff',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                        }}
                      >
                        Learn more about who can message you
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                          Who can send you message requests
                        </p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          People you follow or have chatted with before can always send you messages unless you block them.
                        </p>
                      </div>

                      <RadioCard
                        options={[
                          { label: 'Everyone', value: 'everyone' },
                          { label: 'Your followers', value: 'followers' },
                          { label: 'No one', value: 'no-one' },
                        ]}
                        selectedValue={settings.message_request_audience}
                        onSelect={setMessageRequestAudience}
                        disabled={saving}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                          Who can add you to group chats
                        </p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          People you've blocked cannot add you to group chats.
                        </p>
                      </div>

                      <RadioCard
                        options={[
                          { label: 'Everyone', value: 'everyone' },
                          { label: 'People you follow or have messaged before', value: 'following-or-chatted' },
                        ]}
                        selectedValue={settings.group_invite_audience}
                        onSelect={setGroupInviteAudience}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </>
              ) : messagesView === 'story-replies' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setMessagesView('menu')}
                      style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Story replies</h3>
                  </div>

                  <div style={{ maxWidth: '640px' }}>
                    <div
                      style={{
                        background: '#050505',
                        borderRadius: '4px',
                        padding: '16px 18px',
                        marginBottom: '12px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                        Who can reply to your stories
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <RadioOption
                        label="Everyone"
                        selected={settings.story_reply_audience === 'everyone'}
                        onClick={() => setStoryReplyAudience('everyone')}
                        disabled={saving}
                      />
                      <RadioOption
                        label="People You Follow"
                        selected={settings.story_reply_audience === 'following'}
                        onClick={() => setStoryReplyAudience('following')}
                        disabled={saving}
                      />
                      <RadioOption
                        label="Off"
                        selected={settings.story_reply_audience === 'off'}
                        onClick={() => setStoryReplyAudience('off')}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setMessagesView('menu')}
                      style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Show activity status</h3>
                  </div>

                  <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Show activity status</p>
                      <button
                        onClick={() => toggleSetting('show_activity_status')}
                        disabled={saving}
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '999px',
                          border: 'none',
                          cursor: saving ? 'default' : 'pointer',
                          background: settings.show_activity_status ? '#ffffff' : '#6b7280',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          padding: 0,
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: settings.show_activity_status ? '20px' : '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#0f141a',
                            transition: 'left 0.2s ease',
                          }}
                        />
                      </button>
                    </div>

                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '760px' }}>
                      Allow accounts you follow and anyone you message to see when you were last active or are currently active on CS-Star. When this is turned off, you won't be able to see the activity status of other accounts.
                      <span style={{ color: '#6ea8ff' }}> Learn more</span>
                    </p>

                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      You can continue to use our services if activity status is off.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════ TAGS & MENTIONS ══════ */}
          {activeSection === 'tags-mentions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {tagsView === 'menu' ? (
                <>
                  <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Tags and mentions</h3>

                  <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '34px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500 }}>Who can tag you</p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          Choose who can tag you in their photos and videos. When people try to tag you, they'll see if you don't allow tags from everyone.
                        </p>
                      </div>

                      <RadioCard
                        options={[
                          { label: 'Allow tags from everyone', value: 'everyone' },
                          { label: 'Allow tags from people you follow', value: 'following' },
                          { label: "Don't allow tags", value: 'none' },
                        ]}
                        selectedValue={settings.tag_audience}
                        onSelect={setTagAudience}
                        disabled={saving}
                      />

                      <button
                        onClick={() => setTagsView('manual-approval')}
                        className="glass"
                        style={{
                          width: '100%',
                          maxWidth: '760px',
                          padding: '20px 18px',
                          borderRadius: '22px',
                          border: '1px solid var(--card-border)',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '1rem', fontWeight: 500 }}>Manually approve tags</span>
                        <ChevronRight size={18} color="var(--text-secondary)" />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 500 }}>Who can @mention you</p>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          Choose who can @mention you to link your profile in their stories, notes, comments, live videos, bio, and captions. When people try to @mention you, they'll see if you don't allow @mentions.
                        </p>
                      </div>

                      <RadioCard
                        options={[
                          { label: 'Allow mentions from everyone', value: 'everyone' },
                          { label: 'Allow mentions from people you follow', value: 'following' },
                          { label: "Don't allow mentions", value: 'none' },
                        ]}
                        selectedValue={settings.mention_audience}
                        onSelect={setMentionAudience}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={() => setTagsView('menu')}
                      style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Manually approve tags</h3>
                  </div>

                  <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Manually approve tags</p>
                      <button
                        onClick={() => toggleSetting('manual_tag_approval')}
                        disabled={saving}
                        style={{
                          width: '42px',
                          height: '24px',
                          borderRadius: '999px',
                          border: 'none',
                          cursor: saving ? 'default' : 'pointer',
                          background: settings.manual_tag_approval ? '#ffffff' : '#6b7280',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          padding: 0,
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: '2px',
                            left: settings.manual_tag_approval ? '20px' : '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#0f141a',
                            transition: 'left 0.2s ease',
                          }}
                        />
                      </button>
                    </div>

                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      When this is on, tags from other people won't appear on your profile until you approve them.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════ COMMENTS ══════ */}
          {activeSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Comments</h3>
              <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Allow comments from</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <RadioListOption
                    label="Everyone"
                    selected={settings.comment_audience === 'everyone'}
                    onClick={() => setCommentAudience('everyone')}
                    disabled={saving}
                  />
                  <RadioListOption
                    label="People you follow"
                    subtitle={`${relationshipCounts.following} People`}
                    selected={settings.comment_audience === 'following'}
                    onClick={() => setCommentAudience('following')}
                    disabled={saving}
                  />
                  <RadioListOption
                    label="Your followers"
                    subtitle={`${relationshipCounts.followers} People`}
                    selected={settings.comment_audience === 'followers'}
                    onClick={() => setCommentAudience('followers')}
                    disabled={saving}
                  />
                  <RadioListOption
                    label="People you follow and your followers"
                    subtitle={`${new Set([relationshipCounts.followers, relationshipCounts.following]).size === 1 ? Math.max(relationshipCounts.followers, relationshipCounts.following) : relationshipCounts.followers + relationshipCounts.following} People`}
                    selected={settings.comment_audience === 'following-and-followers'}
                    onClick={() => setCommentAudience('following-and-followers')}
                    disabled={saving}
                  />
                  <RadioListOption
                    label="Off"
                    selected={settings.comment_audience === 'off'}
                    onClick={() => setCommentAudience('off')}
                    disabled={saving}
                  />
                </div>

                <div style={{ height: '8px' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                  <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Allow GIF comments</p>
                  <button
                    onClick={() => toggleSetting('gif_comments_enabled')}
                    disabled={saving}
                    style={{
                      width: '42px',
                      height: '24px',
                      borderRadius: '999px',
                      border: 'none',
                      cursor: saving ? 'default' : 'pointer',
                      background: settings.gif_comments_enabled ? '#ffffff' : '#6b7280',
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      padding: 0,
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: settings.gif_comments_enabled ? '20px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#0f141a',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  People will be able to comment GIFs on your posts and reels.
                </p>
              </div>
            </div>
          )}

          {/* ══════ SHARING & REUSE ══════ */}
          {activeSection === 'sharing-reuse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Sharing and reuse</h3>

              <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Allow people to share your stories</p>
                  <div className="glass" style={{ borderRadius: '22px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <SwitchRow
                      label="Story shares"
                      checked={settings.story_shares_enabled}
                      onToggle={() => toggleSetting('story_shares_enabled')}
                      disabled={saving}
                    />
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    When this is on, people can send your stories in messages.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Allow people to share your posts and reels</p>
                  <div className="glass" style={{ borderRadius: '22px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <SwitchRow
                      label="Posts and reels to stories"
                      checked={settings.posts_reels_to_stories_enabled}
                      onToggle={() => toggleSetting('posts_reels_to_stories_enabled')}
                      disabled={saving}
                      bordered
                    />
                    <SwitchRow
                      label="Reposts on posts and reels"
                      checked={settings.reposts_enabled}
                      onToggle={() => toggleSetting('reposts_enabled')}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Allow people to share externally</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 500 }}>Website embeds</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      When this is on, your public posts or profile can be shown outside of CS-Star, including articles and blogs.
                      <span style={{ color: '#6ea8ff' }}> Learn more</span>
                    </p>
                  </div>
                  <RadioCard
                    options={[
                      { label: 'On', value: 'on' },
                      { label: 'Off', value: 'off' },
                    ]}
                    selectedValue={settings.website_embeds_enabled ? 'on' : 'off'}
                    onSelect={(value) => updateSetting('website_embeds_enabled', value === 'on')}
                    disabled={saving}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>Allow businesses to interact with you</p>
                  <div className="glass" style={{ borderRadius: '22px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                    <SwitchRow
                      label="Featured content requests"
                      checked={settings.featured_content_requests_enabled}
                      onToggle={() => toggleSetting('featured_content_requests_enabled')}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

export default Settings;
