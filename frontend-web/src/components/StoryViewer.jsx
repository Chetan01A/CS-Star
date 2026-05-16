import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { buildAssetUrl } from '../config';
import { motion, AnimatePresence } from 'framer-motion';

function StoryViewer({ usersWithStories, initialUserIndex, onClose }) {
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const STORY_DURATION = 5000; // 5 seconds

  const currentUser = usersWithStories[currentUserIndex];
  const currentStory = currentUser.stories[currentStoryIndex];

  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentUser.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentUserIndex < usersWithStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentUser.stories.length, currentUserIndex, usersWithStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUser = usersWithStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
      setProgress(0);
    }
  }, [currentStoryIndex, currentUserIndex, usersWithStories]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [handleNext, currentStoryIndex, currentUserIndex]);

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <button className="story-nav-btn story-nav-prev" onClick={(e) => { e.stopPropagation(); handlePrev(); }}>
        <ChevronLeft />
      </button>

      <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Progress Bars */}
        <div className="story-viewer-progress-container">
          {currentUser.stories.map((_, idx) => (
            <div key={idx} className="story-progress-bar">
              <div 
                className="story-progress-fill" 
                style={{ 
                  width: idx === currentStoryIndex ? `${progress}%` : idx < currentStoryIndex ? '100%' : '0%' 
                }} 
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-viewer-header">
          <div className="story-avatar" style={{ width: 32, height: 32 }}>
            {currentUser.user.profile_pic ? (
              <img src={buildAssetUrl(currentUser.user.profile_pic)} alt={currentUser.user.username} />
            ) : (
              currentUser.user.username[0].toUpperCase()
            )}
          </div>
          <span style={{ fontWeight: 600, color: 'white' }}>{currentUser.user.username}</span>
          <button 
            onClick={onClose} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentUser.user.id}-${currentStory.id}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ width: '100%', height: '100%' }}
          >
            {currentStory.media_type === 'video' ? (
              <video 
                src={buildAssetUrl(currentStory.media_url)} 
                className="story-viewer-content" 
                autoPlay 
                muted 
                playsInline
              />
            ) : (
              <img 
                src={buildAssetUrl(currentStory.media_url)} 
                alt="Story" 
                className="story-viewer-content" 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="story-nav-btn story-nav-next" onClick={(e) => { e.stopPropagation(); handleNext(); }}>
        <ChevronRight />
      </button>
    </div>
  );
}

export default StoryViewer;
