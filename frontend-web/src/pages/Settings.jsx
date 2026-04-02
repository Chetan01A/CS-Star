import React, { useState } from 'react';
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

const ToggleCard = ({ title, description, enabled, onToggle, actionLabel }) => (
  <div className="glass" style={{ padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
    <div>
      <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{title}</p>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>{description}</p>
    </div>
    <button
      onClick={onToggle}
      className={enabled ? 'btn-primary' : 'glass'}
      style={{ minWidth: '92px', padding: '10px 14px', borderRadius: '12px' }}
    >
      {actionLabel || (enabled ? 'On' : 'Off')}
    </button>
  </div>
);

function Settings() {
  const [activeSettingsSection, setActiveSettingsSection] = useState('edit-profile');
  const [appearanceMode, setAppearanceMode] = useState('dark');
  const [autoplayReels, setAutoplayReels] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [accountPrivate, setAccountPrivate] = useState(false);
  const [showThreadsBadge, setShowThreadsBadge] = useState(true);
  const [showProfileSuggestions, setShowProfileSuggestions] = useState(true);
  const [closeFriendsEnabled, setCloseFriendsEnabled] = useState(false);
  const [storyLocationEnabled, setStoryLocationEnabled] = useState(false);
  const [messageRepliesEnabled, setMessageRepliesEnabled] = useState(true);
  const [tagsMentionsEnabled, setTagsMentionsEnabled] = useState(true);
  const [sharingReuseEnabled, setSharingReuseEnabled] = useState(true);
  const [restrictedAccountsEnabled, setRestrictedAccountsEnabled] = useState(false);
  const [hiddenWordsEnabled, setHiddenWordsEnabled] = useState(true);
  const [mutedAccountsEnabled, setMutedAccountsEnabled] = useState(false);

  const groups = Array.from(new Set(settingsSections.map((section) => section.group)));

  return (
    <div style={{ padding: '24px 28px', minHeight: '100vh' }}>
      <div className="glass" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', minHeight: 'calc(100vh - 48px)', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid var(--card-border)', padding: '26px 18px', overflowY: 'auto' }}>
          <h2 style={{ margin: '0 0 26px', fontSize: '1.4rem' }}>Settings</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {groups.map((group) => (
              <div key={group}>
                <p style={{ margin: '0 0 10px', color: '#c8b07a', fontSize: '0.84rem', fontWeight: 600 }}>{group}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {settingsSections.filter((section) => section.group === group).map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSettingsSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSettingsSection(section.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '16px',
                          border: 'none',
                          cursor: 'pointer',
                          background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                          color: 'white',
                          textAlign: 'left',
                          fontSize: '0.98rem',
                          fontWeight: isActive ? 700 : 500,
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

        <div style={{ padding: '28px 34px', overflowY: 'auto' }}>
          {activeSettingsSection === 'edit-profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Edit profile</h3>
              <div className="glass" style={{ padding: '16px 18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    CS
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 700 }}>c_s_star_</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Chetan Chetan</p>
                  </div>
                </div>
                <button className="btn-primary" style={{ borderRadius: '12px' }}>Change photo</button>
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Website</p>
                <input className="input-field" placeholder="Website" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Bio</p>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>0 / 150</span>
                </div>
                <textarea className="input-field" placeholder="Bio" style={{ minHeight: '110px', resize: 'none' }} />
              </div>
              <ToggleCard title="Show Threads badge" description="Display an extra badge under your profile details." enabled={showThreadsBadge} onToggle={() => setShowThreadsBadge((prev) => !prev)} />
              <div>
                <p style={{ margin: '0 0 10px', fontWeight: 700 }}>Gender</p>
                <select className="input-field">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
                <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>This will not be part of your public profile.</p>
              </div>
              <ToggleCard title="Show account suggestions on profiles" description="Let similar profile suggestions appear for people who view your account." enabled={showProfileSuggestions} onToggle={() => setShowProfileSuggestions((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Notifications</h3>
              <ToggleCard title="Push notifications" description="Control likes, comments, mentions and message alerts." enabled={notificationsEnabled} onToggle={() => setNotificationsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Account privacy</h3>
              <ToggleCard title="Private account" description="Only approved followers can see your posts and videos." enabled={accountPrivate} onToggle={() => setAccountPrivate((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'close-friends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Close friends</h3>
              <ToggleCard title="Close friends list" description="Share stories and notes with a smaller trusted circle." enabled={closeFriendsEnabled} onToggle={() => setCloseFriendsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'blocked' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Blocked</h3>
              <ToggleCard title="Blocked accounts" description="Review and manage people you have blocked." enabled onToggle={() => {}} actionLabel="Manage" />
            </div>
          )}

          {activeSettingsSection === 'story-location' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Story, live and location</h3>
              <ToggleCard title="Location and story sharing" description="Control location sharing and who can interact with your live and story content." enabled={storyLocationEnabled} onToggle={() => setStoryLocationEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Messages and replies</h3>
              <ToggleCard title="Story replies and messages" description="Choose who can reply to your stories and send direct messages." enabled={messageRepliesEnabled} onToggle={() => setMessageRepliesEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'tags-mentions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Tags and mentions</h3>
              <ToggleCard title="Tags and mentions controls" description="Decide who can tag you and mention you in posts, captions, and comments." enabled={tagsMentionsEnabled} onToggle={() => setTagsMentionsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Comments</h3>
              <ToggleCard title="Comment controls" description="Manage filters, mentions, replies, and who can comment on your posts." enabled onToggle={() => {}} actionLabel="Manage" />
            </div>
          )}

          {activeSettingsSection === 'sharing-reuse' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Sharing and reuse</h3>
              <ToggleCard title="Allow sharing and reuse" description="Choose whether others can share your content to stories or reuse it." enabled={sharingReuseEnabled} onToggle={() => setSharingReuseEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'restricted-accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Restricted accounts</h3>
              <ToggleCard title="Restrictions" description="Limit interactions from accounts without fully blocking them." enabled={restrictedAccountsEnabled} onToggle={() => setRestrictedAccountsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'hidden-words' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Hidden words</h3>
              <ToggleCard title="Filter offensive words" description="Hide messages, comments, and requests that may contain offensive content." enabled={hiddenWordsEnabled} onToggle={() => setHiddenWordsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'muted-accounts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Muted accounts</h3>
              <ToggleCard title="Muted accounts list" description="Manage accounts whose posts, stories, or notes you have muted." enabled={mutedAccountsEnabled} onToggle={() => setMutedAccountsEnabled((prev) => !prev)} />
            </div>
          )}

          {activeSettingsSection === 'preferences' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <h3 style={{ margin: 0, fontSize: '1.8rem' }}>Content preferences</h3>
              <ToggleCard title="Autoplay reels" description="Choose whether videos should start automatically." enabled={autoplayReels} onToggle={() => setAutoplayReels((prev) => !prev)} />
              <div className="glass" style={{ padding: '18px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontWeight: 700 }}>Appearance</p>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>Switch your viewing style.</p>
                </div>
                <select value={appearanceMode} onChange={(e) => setAppearanceMode(e.target.value)} className="input-field" style={{ width: '180px', padding: '10px 12px' }}>
                  <option value="dark">Dark</option>
                  <option value="midnight">Midnight</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
