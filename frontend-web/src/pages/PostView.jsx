import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import PostModal from '../components/PostModal';

function PostView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await api.get(`/post/${id}`);
        setPost(data.post);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handleClose = () => {
    // Go back if there's history, otherwise go to feed
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--accent-color)', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ fontSize: '0.9rem' }}>Loading post…</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16, zIndex: 9999
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem' }}>Post not found.</p>
        <button className="btn-primary" onClick={handleClose}>Go Back</button>
      </div>
    );
  }

  return <PostModal post={post} onClose={handleClose} />;
}

export default PostView;
