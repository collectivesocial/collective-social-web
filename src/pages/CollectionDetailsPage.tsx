import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface CollectionDetailsPageProps {
  apiUrl: string;
}

export function CollectionDetailsPage({ apiUrl }: CollectionDetailsPageProps) {
  const { collectionUri } = useParams<{ collectionUri: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    creator: '',
    mediaType: 'book',
    status: 'want',
    rating: 0,
    review: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        navigate('/');
      });
  }, [apiUrl, navigate]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newItem),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      setShowAddItemModal(false);
      setNewItem({
        title: '',
        creator: '',
        mediaType: 'book',
        status: 'want',
        rating: 0,
        review: '',
      });
      
      // Reload the page to show the new item
      window.location.reload();
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Failed to add item to collection');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <button
            onClick={() => navigate('/collections')}
            style={{
              background: 'none',
              border: 'none',
              color: '#646cff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              padding: 0,
            }}
          >
            ← Back to Collections
          </button>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>
            Collection
          </h1>
        </div>
        <button
          onClick={() => setShowAddItemModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          + Add Item
        </button>
      </div>

      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#1a1a1a',
        border: '2px dashed #333',
        borderRadius: '12px',
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          opacity: 0.5,
        }}>
          📝
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#888' }}>
          No items yet
        </h3>
        <p style={{ color: '#666', margin: 0 }}>
          Add your first item to start tracking and reviewing.
        </p>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowAddItemModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              margin: '1rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Add Item to Collection</h2>
            <form onSubmit={handleAddItem}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., The Great Gatsby"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Creator/Author
                </label>
                <input
                  type="text"
                  value={newItem.creator}
                  onChange={(e) => setNewItem({ ...newItem, creator: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., F. Scott Fitzgerald"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Media Type
                </label>
                <select
                  value={newItem.mediaType}
                  onChange={(e) => setNewItem({ ...newItem, mediaType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                >
                  <option value="book">Book</option>
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                  <option value="podcast">Podcast</option>
                  <option value="article">Article/Blog Post</option>
                  <option value="game">Game</option>
                  <option value="music">Music</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Status
                </label>
                <select
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                >
                  <option value="want">Want to Experience</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Rating (0-5 stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewItem({ ...newItem, rating: star })}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        opacity: star <= newItem.rating ? 1 : 0.3,
                      }}
                    >
                      {star % 1 === 0 ? '⭐' : '✨'}
                    </button>
                  ))}
                  <span style={{ marginLeft: '0.5rem', color: '#888' }}>
                    {newItem.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Review/Notes
                </label>
                <textarea
                  value={newItem.review}
                  onChange={(e) => setNewItem({ ...newItem, review: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                  placeholder="Your thoughts and notes..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#ddd',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#646cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
