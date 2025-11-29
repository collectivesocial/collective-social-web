import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

interface PublicProfilePageProps {
  apiUrl: string;
}

export function PublicProfilePage({ apiUrl }: PublicProfilePageProps) {
  const { handle } = useParams<{ handle: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!handle) {
      setError('No handle provided');
      setLoading(false);
      return;
    }

    // Fetch current user if logged in
    const fetchCurrentUser = async () => {
      try {
        const userRes = await fetch(`${apiUrl}/users/me`, {
          credentials: 'include',
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setCurrentUser(userData);
          return userData;
        }
      } catch (err) {
        console.log('User not logged in');
      }
      return null;
    };

    // Fetch user profile from Bluesky public API
    const fetchProfile = async () => {
      try {
        const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
        if (!res.ok) {
          throw new Error('Profile not found');
        }
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        throw err;
      }
    };

    const loadProfile = async () => {
      try {
        const [currentUserData, profileData] = await Promise.all([
          fetchCurrentUser(),
          fetchProfile(),
        ]);

        const profile: UserProfile = {
          did: profileData.did,
          handle: profileData.handle,
          displayName: profileData.displayName,
          avatar: profileData.avatar,
          description: profileData.description,
        };
        setUser(profile);

        // Fetch public collections for this user
        try {
          const collectionsRes = await fetch(`${apiUrl}/collections/public/${profileData.did}`);
          if (collectionsRes.ok) {
            const collectionsData = await collectionsRes.json();
            setCollections(collectionsData.collections);
          }
        } catch (err) {
          console.error('Failed to load collections:', err);
        }

        // Check follow status if logged in and viewing someone else's profile
        if (currentUserData && currentUserData.did !== profileData.did) {
          try {
            const followRes = await fetch(`${apiUrl}/users/following/${profileData.did}`, {
              credentials: 'include',
            });
            if (followRes.ok) {
              const followData = await followRes.json();
              console.log({followData})
              setIsFollowing(followData.isFollowing);
            }
          } catch (err) {
            console.error('Failed to check follow status:', err);
          }
        }

        setLoading(false);
      } catch (err) {
        // Error already handled in fetchProfile
      }
    };

    loadProfile();
  }, [apiUrl, handle]);

  const handleFollow = async () => {
    if (!user) return;
    
    setFollowLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/follow/${user.did}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        setIsFollowing(true);
      } else {
        alert('Failed to follow user');
      }
    } catch (err) {
      console.error('Failed to follow:', err);
      alert('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    
    setFollowLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/unfollow/${user.did}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setIsFollowing(false);
      } else {
        alert('Failed to unfollow user');
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
      alert('Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
                  {user.displayName || user.handle}
                </h1>
                <a
                  href={`https://bsky.app/profile/${user.did}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#888',
                    fontSize: '1.125rem',
                    textDecoration: 'none',
                    display: 'inline-block',
                    marginBottom: '1rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#646cff';
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#888';
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  @{user.handle}
                </a>
              </div>
              
              {/* Show follow button only if logged in and viewing someone else's profile */}
              {currentUser && currentUser.did !== user.did && (
                <div>
                  {isFollowing ? (
                    <button
                      onClick={() => {
                        if (window.confirm('Unfollow this user?')) {
                          handleUnfollow();
                        }
                      }}
                      disabled={followLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: '2px solid #646cff',
                        backgroundColor: 'transparent',
                        color: '#646cff',
                        cursor: followLoading ? 'wait' : 'pointer',
                        opacity: followLoading ? 0.5 : 0.9,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!followLoading) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!followLoading) {
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                    >
                      {followLoading ? 'Updating...' : 'Following'}
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#646cff',
                        color: 'white',
                        cursor: followLoading ? 'wait' : 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (!followLoading) {
                          e.currentTarget.style.backgroundColor = '#535bf2';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#646cff';
                      }}
                    >
                      {followLoading ? 'Following...' : '+ Follow'}
                    </button>
                  )}
                </div>
              )}
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
