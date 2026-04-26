import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Image, X, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

function CreatePost() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
    }
  };

  const isVideo = file?.type?.startsWith('video/');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError(t('create.selectMediaFirst'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Backend expects 'caption' as a query parameter or part of multipart
      // Based on post.py line 97: upload_post(caption: str, file: UploadFile ...)
      // FastAPI usually expects form data for this
      formData.append('caption', caption);

      await api.upload(`/post/upload?caption=${encodeURIComponent(caption)}`, formData);
      navigate('/');
    } catch (err) {
      setError(err.message || t('create.uploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '100px 24px' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass" 
        style={{ padding: '32px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 className="gradient-text" style={{ margin: 0 }}>{t('create.title')}</h2>
          <X onClick={() => navigate('/')} className="cursor-pointer" />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Custom Upload Area */}
          <div 
            onClick={() => document.getElementById('file-upload').click()}
            style={{ 
              width: '100%', aspectRatio: '1/1', background: 'rgba(255,255,255,0.05)',
              border: '2px dashed var(--card-border)', borderRadius: '16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', overflow: 'hidden', cursor: 'pointer',
              position: 'relative'
            }}
          >
            {preview ? (
              isVideo ? (
                <video src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
              ) : (
                <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )
            ) : (
              <>
                <Image size={48} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
                <p>{t('create.uploadPrompt')}</p>
              </>
            )}
            <input 
              id="file-upload" 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>

          <textarea 
            placeholder={t('create.captionPlaceholder')}
            className="input-field"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ minHeight: '100px', resize: 'none' }}
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading || !file}>
            {loading ? t('create.sharing') : <><Upload size={20} /> {t('create.shareMedia')}</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default CreatePost;
