import React, { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { api } from '../api';
import { buildAssetUrl } from '../config';
import { useNotice } from '../context/NoticeContext';

import './StoryBar.css';
import StoryViewer from './StoryViewer';

function StoryBar() {
  const { showNotice } = useNotice();

  const [stories, setStories] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUserIndex, setSelectedUserIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
    // Get current user info from local storage or context
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
  }, []);

  const fetchStories = async () => {
    try {
      const data = await api.fetch('/story/feed');
      setStories(data);
    } catch (err) {
      console.error('Failed to fetch stories:', err);
    }
  };

  const handleAddStory = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', file.type.startsWith('video') ? 'video' : 'image');

    try {
      await api.fetch('/story/upload', {
        method: 'POST',
        body: formData,
        // No need for headers, browser adds multipart/form-data
        headers: {} 
      });
      fetchStories();
    } catch (err) {
      console.error('Failed to upload story:', err);
      showNotice('Failed to upload story', 'error');
    } finally {

      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const openStory = (index) => {
    setSelectedUserIndex(index);
  };

  return (
    <div className="story-bar">
      {/* Current User Add Story */}
      <div className="story-item" onClick={handleAddStory}>
        <div className="story-avatar-wrapper my-story">
          <div className="story-avatar">
            {currentUser?.profile_pic ? (
              <img src={buildAssetUrl(currentUser.profile_pic)} alt="Me" />
            ) : (
              currentUser?.username?.[0]?.toUpperCase() || '?'
            )}
          </div>
          <div className="add-story-btn">
            {isUploading ? '...' : <Plus size={14} />}
          </div>
        </div>
        <span className="story-username">Your Story</span>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept="image/*,video/*"
        />
      </div>

      {/* Others' Stories */}
      {stories.map((item, index) => (
        <div 
          key={item.user.id} 
          className="story-item" 
          onClick={() => openStory(index)}
        >
          <div className={`story-avatar-wrapper unviewed`}>
            <div className="story-avatar">
              {item.user.profile_pic ? (
                <img src={buildAssetUrl(item.user.profile_pic)} alt={item.user.username} />
              ) : (
                item.user.username[0].toUpperCase()
              )}
            </div>
          </div>
          <span className="story-username">{item.user.username}</span>
        </div>
      ))}

      {selectedUserIndex !== null && (
        <StoryViewer 
          usersWithStories={stories} 
          initialUserIndex={selectedUserIndex} 
          onClose={() => setSelectedUserIndex(null)} 
        />
      )}
    </div>
  );
}

export default StoryBar;
