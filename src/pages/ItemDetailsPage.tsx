import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  totalReviews: number;
  averageRating: number | null;
}

interface ItemDetailsPageProps {
  apiUrl: string;
}

export function ItemDetailsPage({ apiUrl }: ItemDetailsPageProps) {
  const { itemId } = useParams<{ itemId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<MediaItem | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${apiUrl}/media/${itemId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch item details');
        }

        const data = await response.json();
        setItem(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [apiUrl, itemId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error || 'Item not found'}</div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: '#646cff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          padding: 0,
        }}
      >
        ← Back
      </button>

      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          {item.coverImage && (
            <img
              src={item.coverImage}
              alt={item.title}
              style={{
                width: '200px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            />
          )}
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
              {item.title}
            </h1>
            
            {item.creator && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '1.125rem' }}>
                by {item.creator}
              </p>
            )}

            {item.publishedYear && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.9375rem' }}>
                Published: {item.publishedYear}
              </p>
            )}

            {item.isbn && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.875rem' }}>
                ISBN: {item.isbn}
              </p>
            )}

            {item.totalReviews > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginTop: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem', color: '#ffd700' }}>
                    {'⭐'.repeat(Math.floor(item.averageRating || 0))}
                    {(item.averageRating || 0) % 1 >= 0.5 && '✨'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {item.averageRating?.toFixed(1)}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.875rem' }}>
                      {item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {item.description && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
              Description
            </h2>
            <p style={{
              margin: 0,
              color: '#ddd',
              lineHeight: '1.6',
              fontSize: '0.9375rem',
              whiteSpace: 'pre-wrap',
            }}>
              {item.description}
            </p>
          </div>
        )}

        {item.totalReviews === 0 && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
          }}>
            <p style={{ margin: 0, color: '#888' }}>
              No reviews yet. Be the first to review this {item.mediaType}!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
