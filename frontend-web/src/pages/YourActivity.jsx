import React, { useState } from 'react';
import { Activity, Clock, Heart, MessageCircle, AtSign, Calendar, ChevronRight, BarChart2, Trash2, Archive, Link2, ChevronLeft, Image, PlaySquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ActivityCard = ({ icon: Icon, title, description, color, onClick }) => (
  <button
    onClick={onClick}
    className="glass"
    style={{
      padding: '20px',
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
      transition: 'all 0.2s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: `rgba(${color}, 0.15)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid rgba(${color}, 0.3)`,
        color: `rgb(${color})`
      }}>
        <Icon size={24} />
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '1.1rem' }}>{title}</p>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
      </div>
    </div>
    <ChevronRight size={20} color="var(--text-secondary)" />
  </button>
);

const SubPageHeader = ({ title, onBack }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
    <button 
      onClick={onBack}
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer'
      }}
    >
      <ChevronLeft size={24} />
    </button>
    <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>{title}</h1>
  </div>
);

function YourActivity() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');

  const renderOverview = () => (
    <>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={32} color="#0095f6" />
          {t('Your Activity')}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          {t('One place to manage your interactions, content, and account history. Review and manage everything you\'ve shared on CS-Star.')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        <ActivityCard 
          icon={Clock} 
          title={t('Time Spent')} 
          description={t('See how much time you usually spend on CS-Star each day.')} 
          color="0, 149, 246" 
          onClick={() => setActiveTab('time-spent')}
        />
        <ActivityCard 
          icon={Heart} 
          title={t('Interactions')} 
          description={t('Review and manage your likes, comments, and other interactions.')} 
          color="241, 48, 104" 
          onClick={() => setActiveTab('interactions')}
        />
        <ActivityCard 
          icon={BarChart2} 
          title={t('Photos and videos')} 
          description={t('View, archive, or delete photos and videos you\'ve shared.')} 
          color="0, 200, 83" 
          onClick={() => setActiveTab('photos-videos')}
        />
        <ActivityCard 
          icon={Calendar} 
          title={t('Account history')} 
          description={t('Review changes you\'ve made to your account since you created it.')} 
          color="156, 39, 176" 
          onClick={() => setActiveTab('account-history')}
        />
        <ActivityCard 
          icon={Link2} 
          title={t('Links you\'ve visited')} 
          description={t('See which links you\'ve visited recently.')} 
          color="255, 152, 0" 
          onClick={() => setActiveTab('links')}
        />
        <ActivityCard 
          icon={Archive} 
          title={t('Archived')} 
          description={t('View content you\'ve hidden from your profile.')} 
          color="158, 158, 158" 
          onClick={() => setActiveTab('archived')}
        />
        <ActivityCard 
          icon={Trash2} 
          title={t('Recently deleted')} 
          description={t('View and manage content you\'ve deleted recently.')} 
          color="244, 67, 54" 
          onClick={() => setActiveTab('deleted')}
        />
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '24px', padding: '24px', borderTop: '1px solid var(--card-border)' }}>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {t('Some activity may take a few moments to appear here. Downloading your information provides a complete copy of what you\'ve shared.')}
        </p>
      </div>
    </>
  );

  const renderTimeSpent = () => (
    <div>
      <SubPageHeader title={t('Time Spent')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '32px', borderRadius: '24px', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>{t('Daily Average')}</p>
        <p style={{ margin: '0 0 32px', fontSize: '3rem', fontWeight: 900 }}>45 {t('m')}</p>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', height: '150px', marginBottom: '16px' }}>
          {[30, 45, 60, 20, 90, 40, 45].map((height, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: `${height}px`, background: i === 6 ? '#0095f6' : 'rgba(255,255,255,0.2)', borderRadius: '8px' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'][i]}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('Your average time spent on CS-Star this week.')}</p>
      </div>
    </div>
  );

  const renderInteractions = () => (
    <div>
      <SubPageHeader title={t('Interactions')} onBack={() => setActiveTab('overview')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ActivityCard icon={Heart} title={t('Likes')} description={t('View and manage your likes.')} color="241, 48, 104" onClick={() => {}} />
        <ActivityCard icon={MessageCircle} title={t('Comments')} description={t('View and manage your comments.')} color="0, 149, 246" onClick={() => {}} />
        <ActivityCard icon={AtSign} title={t('Tags')} description={t('View and manage posts you are tagged in.')} color="156, 39, 176" onClick={() => {}} />
      </div>
    </div>
  );

  const renderPhotosVideos = () => (
    <div>
      <SubPageHeader title={t('Photos and videos')} onBack={() => setActiveTab('overview')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <ActivityCard icon={Image} title={t('Posts')} description={t('View, archive, or delete photos and videos you\'ve shared.')} color="0, 200, 83" onClick={() => {}} />
        <ActivityCard icon={PlaySquare} title={t('Reels')} description={t('View, archive, or delete Reels you\'ve shared.')} color="255, 152, 0" onClick={() => {}} />
      </div>
    </div>
  );

  const renderAccountHistory = () => (
    <div>
      <SubPageHeader title={t('Account history')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { date: 'Today', action: 'Bio updated', desc: 'You changed your bio.' },
            { date: 'Last week', action: 'Privacy changed', desc: 'You made your account private.' },
            { date: 'Last month', action: 'Password changed', desc: 'You successfully changed your password.' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} />
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{item.action}</p>
                <p style={{ margin: '0 0 4px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLinks = () => (
    <div>
      <SubPageHeader title={t('Links you\'ve visited')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Link2 size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Links Visited')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('You haven\'t visited any external links recently.')}</p>
      </div>
    </div>
  );

  const renderArchived = () => (
    <div>
      <SubPageHeader title={t('Archived')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Archive size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Archived Posts')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('When you archive posts, they will appear here.')}</p>
      </div>
    </div>
  );

  const renderDeleted = () => (
    <div>
      <SubPageHeader title={t('Recently deleted')} onBack={() => setActiveTab('overview')} />
      <div className="glass" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
        <Trash2 size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
        <h3 style={{ margin: '0 0 8px' }}>{t('No Recently Deleted Content')}</h3>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{t('Content you delete will stay here for 30 days before it\'s permanently deleted.')}</p>
      </div>
    </div>
  );

  return (
    <div className="page-shell" style={{ padding: '24px 28px', minHeight: '100vh', overflowY: 'auto' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'time-spent' && renderTimeSpent()}
        {activeTab === 'interactions' && renderInteractions()}
        {activeTab === 'photos-videos' && renderPhotosVideos()}
        {activeTab === 'account-history' && renderAccountHistory()}
        {activeTab === 'links' && renderLinks()}
        {activeTab === 'archived' && renderArchived()}
        {activeTab === 'deleted' && renderDeleted()}
      </div>
    </div>
  );
}

export default YourActivity;
