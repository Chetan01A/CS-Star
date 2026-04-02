const SAVED_ITEMS_KEY = 'csstar_saved_items_v1';
const SAVED_COLLECTIONS_KEY = 'csstar_saved_collections_v1';
const DEFAULT_COLLECTION_ID = 'default';
const DEFAULT_COLLECTION_NAME = 'All Saved';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getSavedItems = () => readJson(SAVED_ITEMS_KEY, []);

export const getSavedCollections = () => {
  const collections = readJson(SAVED_COLLECTIONS_KEY, []);
  const hasDefault = collections.some((c) => c.id === DEFAULT_COLLECTION_ID);
  if (hasDefault) return collections;

  const next = [
    { id: DEFAULT_COLLECTION_ID, name: DEFAULT_COLLECTION_NAME, itemIds: [] },
    ...collections,
  ];
  writeJson(SAVED_COLLECTIONS_KEY, next);
  return next;
};

const saveCollections = (collections) => writeJson(SAVED_COLLECTIONS_KEY, collections);
const saveItems = (items) => writeJson(SAVED_ITEMS_KEY, items);

export const isItemSaved = (postId) => {
  const items = getSavedItems();
  return items.some((item) => String(item.post_id) === String(postId));
};

const addItemToDefaultCollection = (postId) => {
  const id = String(postId);
  const collections = getSavedCollections();
  const next = collections.map((collection) => {
    if (collection.id !== DEFAULT_COLLECTION_ID) return collection;
    if (collection.itemIds.includes(id)) return collection;
    return { ...collection, itemIds: [...collection.itemIds, id] };
  });
  saveCollections(next);
};

const removeItemFromCollections = (postId) => {
  const id = String(postId);
  const collections = getSavedCollections();
  const next = collections.map((collection) => ({
    ...collection,
    itemIds: collection.itemIds.filter((itemId) => itemId !== id),
  }));
  saveCollections(next);
};

export const toggleSavedItem = (post) => {
  const postId = String(post.post_id);
  const items = getSavedItems();
  const exists = items.some((item) => String(item.post_id) === postId);

  if (exists) {
    saveItems(items.filter((item) => String(item.post_id) !== postId));
    removeItemFromCollections(postId);
    return false;
  }

  const nextItem = {
    post_id: post.post_id,
    user_id: post.user_id,
    username: post.username,
    profile_pic: post.profile_pic || '',
    image_url: post.image_url,
    caption: post.caption || '',
    media_type: post.media_type || 'image',
    saved_at: new Date().toISOString(),
  };

  saveItems([nextItem, ...items]);
  addItemToDefaultCollection(postId);
  return true;
};

export const createCollection = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;

  const collections = getSavedCollections();
  if (collections.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return null;
  }

  const next = {
    id: `col_${Date.now()}`,
    name: trimmed,
    itemIds: [],
  };
  const updated = [...collections, next];
  saveCollections(updated);
  return next;
};

export const addItemToCollection = (postId, collectionId) => {
  const id = String(postId);
  const collections = getSavedCollections();
  const next = collections.map((collection) => {
    if (collection.id !== collectionId) return collection;
    if (collection.itemIds.includes(id)) return collection;
    return { ...collection, itemIds: [...collection.itemIds, id] };
  });
  saveCollections(next);
};

const upsertItem = (post) => {
  const postId = String(post.post_id);
  const items = getSavedItems();
  const exists = items.some((item) => String(item.post_id) === postId);
  if (exists) return;

  const nextItem = {
    post_id: post.post_id,
    user_id: post.user_id,
    username: post.username,
    profile_pic: post.profile_pic || '',
    image_url: post.image_url,
    caption: post.caption || '',
    media_type: post.media_type || 'image',
    saved_at: new Date().toISOString(),
  };
  saveItems([nextItem, ...items]);
};

export const saveItemToCollection = (post, collectionId = DEFAULT_COLLECTION_ID) => {
  if (!post?.post_id) return false;
  upsertItem(post);
  addItemToCollection(post.post_id, collectionId);
  return true;
};

export const removeItemCompletely = (postId) => {
  const id = String(postId);
  const items = getSavedItems();
  saveItems(items.filter((item) => String(item.post_id) !== id));
  removeItemFromCollections(id);
};
