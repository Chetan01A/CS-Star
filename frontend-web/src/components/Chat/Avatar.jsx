import React from 'react';
import { buildAssetUrl } from '../../config';

const Avatar = ({ user, size = 40, onlineUsers = new Set() }) => {
  const hasProfilePic = user && user.profile_pic;
  const isOnline = onlineUsers.has(user?.id);
  
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      {hasProfilePic ? (
        <img 
          src={buildAssetUrl(user.profile_pic)} 
          alt={user.username} 
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} 
        />
      ) : (
        <div style={{ 
          width: size, 
          height: size, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #22c55e, #06b6d4)', 
          display: 'grid', 
          placeItems: 'center', 
          color: '#fff', 
          fontWeight: 700, 
          fontSize: size * 0.45 
        }}>
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
      {isOnline && (
        <span style={{ 
          position: 'absolute', 
          bottom: 0, 
          right: 0, 
          width: size * 0.28, 
          height: size * 0.28, 
          background: '#22c55e', 
          border: '2px solid #0f172a', 
          borderRadius: '50%' 
        }} />
      )}
    </div>
  );
};

export default Avatar;
