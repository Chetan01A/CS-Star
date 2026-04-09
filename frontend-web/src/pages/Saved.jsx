import React, { useMemo, useState } from 'react';
import { Bookmark, FolderPlus, Trash2 } from 'lucide-react';
import {
  getSavedItems,
  getSavedCollections,
  createCollection,
  addItemToCollection,
  removeItemCompletely,
} from '../utils/saved';
import { buildAssetUrl } from '../config';

const toMediaUrl = (value) => {
  return buildAssetUrl(value);
};

function Saved() {
  const [items, setItems] = useState(() => getSavedItems());
  const [collections, setCollections] = useState(() => getSavedCollections());
  const [activeCollectionId, setActiveCollectionId] = useState('default');
  const [newCollectionName, setNewCollectionName] = useState('');

  const activeCollection = useMemo(
    () => collections.find((c) => c.id === activeCollectionId) || collections[0],
    [collections, activeCollectionId]
  );

  const visibleItems = useMemo(() => {
    if (!activeCollection) return [];
    const ids = new Set(activeCollection.itemIds.map(String));
    return items.filter((item) => ids.has(String(item.post_id)));
  }, [items, activeCollection]);

  const handleCreateCollection = () => {
    const created = createCollection(newCollectionName);
    if (!created) return;
    setCollections(getSavedCollections());
    setNewCollectionName('');
    setActiveCollectionId(created.id);
  };

  const handleRemoveSaved = (postId) => {
    removeItemCompletely(postId);
    setItems(getSavedItems());
    setCollections(getSavedCollections());
  };

  const handleAddToCollection = (postId, collectionId) => {
    addItemToCollection(postId, collectionId);
    setCollections(getSavedCollections());
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '48px 24px' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Saved</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Your saved posts and videos, organized by collections.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '18px' }}>
        <section className="glass" style={{ padding: '14px', height: 'fit-content' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="New collection"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              style={{ padding: '10px 12px' }}
            />
            <button type="button" className="btn-primary" onClick={handleCreateCollection} style={{ padding: '0 12px' }}>
              <FolderPlus size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => setActiveCollectionId(collection.id)}
                style={{
                  border: '1px solid var(--card-border)',
                  background: activeCollectionId === collection.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: 'white',
                  borderRadius: '10px',
                  textAlign: 'left',
                  padding: '10px 12px',
                  cursor: 'pointer',
                }}
              >
                {collection.name} ({collection.itemIds.length})
              </button>
            ))}
          </div>
        </section>

        <section>
          {visibleItems.length === 0 ? (
            <div className="glass" style={{ padding: '56px', textAlign: 'center' }}>
              <Bookmark size={42} style={{ marginBottom: '10px', opacity: 0.8 }} />
              <p style={{ margin: 0 }}>No saved posts in this collection yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {visibleItems.map((item) => (
                <div key={item.post_id} className="glass" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                  <div style={{ height: '250px', background: '#111' }}>
                    {item.media_type === 'video' ? (
                      <video src={toMediaUrl(item.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={toMediaUrl(item.image_url)} alt={item.caption || 'saved'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ padding: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>{item.username}</p>
                    <p style={{ margin: '6px 0 10px', color: 'var(--text-secondary)', fontSize: '0.84rem', minHeight: '34px' }}>
                      {item.caption || 'Saved post'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) handleAddToCollection(item.post_id, e.target.value);
                          e.target.value = '';
                        }}
                        className="input-field"
                        style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                      >
                        <option value="">Add to collection</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveSaved(item.post_id)}
                        style={{
                          border: '1px solid var(--card-border)',
                          background: 'transparent',
                          color: 'var(--error-color)',
                          borderRadius: '10px',
                          padding: '0 10px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Saved;
