import React, { useEffect, useMemo, useState } from 'react';
import { Bookmark, FolderPlus } from 'lucide-react';
import {
  createCollection,
  getSavedCollections,
  isItemSaved,
  removeItemCompletely,
  saveItemToCollection,
} from '../utils/saved';

function SavePopover({ post, onSaved }) {
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [collections, setCollections] = useState(() => getSavedCollections());
  const [newCollectionName, setNewCollectionName] = useState('');
  const [saved, setSaved] = useState(() => isItemSaved(post?.post_id));
  const [anchor, setAnchor] = useState({ top: 0, left: 0 });
  const [closeTimer, setCloseTimer] = useState(null);

  useEffect(() => {
    setSaved(isItemSaved(post?.post_id));
  }, [post?.post_id]);

  useEffect(() => {
    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [closeTimer]);

  const updateAnchor = (element) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const panelWidth = 250;
    const panelHeight = 50;
    const desiredLeft = rect.left - (panelWidth / 2) + (rect.width / 2);
    const maxLeft = window.innerWidth - 258;
    setAnchor({
      top: rect.top - panelHeight - 10,
      left: Math.min(Math.max(8, desiredLeft), maxLeft),
    });
  };

  const handleWrapperEnter = (element) => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      setCloseTimer(null);
    }
    updateAnchor(element);
    setOpen(true);
    setShowList(false);
  };

  const handlePopupEnter = () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      setCloseTimer(null);
    }
  };

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      setOpen(false);
      setShowList(false);
    }, 550);
    setCloseTimer(timer);
  };

  const visibleCollections = useMemo(
    () => collections.filter((c) => c.id !== 'default'),
    [collections]
  );

  const handleSaveToCollection = (collectionId) => {
    saveItemToCollection(post, collectionId || 'default');
    setSaved(true);
    setOpen(false);
    setShowList(false);
    if (onSaved) onSaved('Post was saved', true);
  };

  const handleCreateCollection = () => {
    const created = createCollection(newCollectionName);
    if (!created) return;
    setCollections(getSavedCollections());
    setNewCollectionName('');
    saveItemToCollection(post, created.id);
    setSaved(true);
    setOpen(false);
    setShowList(false);
    if (onSaved) onSaved(`Saved to ${created.name}`, true);
  };

  const handlePrimaryClick = (e) => {
    e.stopPropagation();
    if (saved) {
      removeItemCompletely(post.post_id);
      setSaved(false);
      if (onSaved) onSaved('Post was unsaved', false);
      return;
    }
    handleSaveToCollection('default');
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={(e) => handleWrapperEnter(e.currentTarget)}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onMouseEnter={(e) => handleWrapperEnter(e.currentTarget)}
        onMouseMove={(e) => handleWrapperEnter(e.currentTarget)}
        onFocus={(e) => handleWrapperEnter(e.currentTarget)}
        onClick={handlePrimaryClick}
        style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'inline-flex' }}
        aria-label="Save post"
      >
        <Bookmark size={24} fill={saved ? 'white' : 'none'} />
      </button>

      {open && (
        <div
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: `${Math.max(8, anchor.top)}px`,
            left: `${anchor.left}px`,
            width: '250px',
            padding: '0',
            borderRadius: '8px',
            zIndex: 1300,
            border: '1px solid var(--card-border)',
            background: 'rgba(28,28,30,0.98)',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '-8px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid rgba(28,28,30,0.98)' }} />
          <button
            type="button"
            onClick={() => setShowList((prev) => !prev)}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1 }}>Collections</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600, lineHeight: 1 }}>+</span>
          </button>

          {showList && (
            <div style={{ borderTop: '1px solid var(--card-border)', padding: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Create collection"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleCreateCollection}
                  style={{
                    border: '1px solid var(--card-border)',
                    background: 'transparent',
                    color: 'white',
                    borderRadius: '8px',
                    width: '34px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Create collection"
                >
                  <FolderPlus size={16} />
                </button>
              </div>

              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleSaveToCollection('default')}
                  style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white', padding: '9px 10px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}
                >
                  All Saved
                </button>
                {visibleCollections.map((collection) => (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => handleSaveToCollection(collection.id)}
                    style={{ border: 'none', background: 'transparent', color: 'white', padding: '9px 10px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer' }}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SavePopover;
