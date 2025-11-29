import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility: string;
  purpose: string;
  avatar: string | null;
  createdAt: string;
}

interface ProfilePageProps {
  apiUrl: string;
}

export function ProfilePage({ apiUrl }: ProfilePageProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then(async (data) => {
        setUser(data);
        
        // Fetch public collections for this user
        try {
          const collectionsRes = await fetch(`${apiUrl}/collections/public/${data.did}`, {
            credentials: 'include',
          });
          if (collectionsRes.ok) {
            const collectionsData = await collectionsRes.json();
            setCollections(collectionsData.collections);
          }
        } catch (err) {
          console.error('Failed to load collections:', err);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        // Redirect to home if not authenticated
        navigate('/');
      });
  }, [apiUrl, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error || 'Unable to load profile'}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #333',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '2rem',
          marginBottom: '2rem',
        }}>
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.displayName || user.handle}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #646cff',
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: '#646cff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              fontWeight: 'bold',
            }}>
              {(user.displayName || user.handle).charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
              {user.displayName || user.handle}
            </h1>
            <div style={{ color: '#888', fontSize: '1.125rem', marginBottom: '1rem' }}>
              @{user.handle}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              backgroundColor: '#2a2a2a',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#888',
            }}>
              DID: {user.did}
            </div>
          </div>
        </div>

        {user.description && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            marginTop: '1.5rem',
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Bio</h3>
            <p style={{
              margin: 0,
              lineHeight: '1.6',
              color: '#ddd',
              whiteSpace: 'pre-wrap',
            }}>
              {user.description}
            </p>
          </div>
        )}

        {!user.description && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            marginTop: '1.5rem',
            textAlign: 'center',
            color: '#888',
          }}>
            <p style={{ margin: 0 }}>No bio added yet</p>
          </div>
        )}
      </div>

      {/* Public Collections */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #333',
        marginTop: '2rem',
      }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>Public Collections</h2>
        {collections.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#888',
          }}>
            <p style={{ margin: 0 }}>No public collections yet</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem',
          }}>
            {collections.map((collection) => (
              <div
                key={collection.uri}
                style={{
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#646cff')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#333')}
                onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
              >
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>
                  {collection.name}
                </h3>
                {collection.description && (
                  <p style={{
                    color: '#888',
                    fontSize: '0.875rem',
                    margin: '0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {collection.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
