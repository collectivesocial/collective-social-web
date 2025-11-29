import { useEffect, useState } from 'react';
import { LoginButton } from '../components/LoginButton';

interface HomePageProps {
  isAuthenticated: boolean;
  user: {
    displayName?: string;
    handle: string;
  } | null;
  apiUrl: string;
}

interface FeedEvent {
  id: number;
  eventName: string;
  mediaLink: string | null;
  userDid: string;
  createdAt: string;
}

interface UserProfile {
  handle: string;
  avatar?: string;
  displayName?: string;
}

export function HomePage({ isAuthenticated, user, apiUrl }: HomePageProps) {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch feed events
    fetch(`${apiUrl}/feed/events?limit=20`)
      .then((res) => res.json())
      .then(async (data) => {
        setFeedEvents(data.events);
        
        // Fetch user profiles for all DIDs in the feed
        const uniqueDids = Array.from(new Set(data.events.map((e: FeedEvent) => e.userDid))) as string[];
        const profiles: Record<string, UserProfile> = {};
        
        await Promise.all(
          uniqueDids.map(async (did) => {
            try {
              const profileRes = await fetch(
                `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
              );
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                profiles[did] = {
                  handle: profileData.handle,
                  avatar: profileData.avatar,
                  displayName: profileData.displayName,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch profile for ${did}:`, err);
            }
          })
        );
        
        setUserProfiles(profiles);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load feed events:', err);
        setLoading(false);
      });
  }, [apiUrl]);

  // Parse event name to create clickable links for handle and book title
  const renderEventName = (event: FeedEvent) => {
    const { eventName, mediaLink } = event;
    
    // Pattern: "{handle} {action} "{title}"
    const match = eventName.match(/^(.+?)\s+(wants to read|started reading|finished reading|joined Collective!)\s*"?(.+?)"?$/);
    
    if (!match) {
      return <span>{eventName}</span>;
    }

    const [, handle, action, title] = match;

    return (
      <span>
        <a
          href={`/profile/${handle}`}
          style={{
            color: '#646cff',
            textDecoration: 'none',
            fontWeight: '600',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          {handle}
        </a>
        {' '}{action}{' '}
        {title && title !== 'Collective!' && mediaLink ? (
          <>
            "
            <a
              href={mediaLink}
              style={{
                color: '#646cff',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              {title}
            </a>
            "
          </>
        ) : title ? (
          `"${title}"`
        ) : null}
      </span>
    );
  };

  if (isAuthenticated && user) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2>Welcome back, {user.displayName || user.handle}!</h2>
        </div>

        {/* Feed Section */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
          {loading ? (
            <p style={{ color: '#888' }}>Loading feed...</p>
          ) : feedEvents.length === 0 ? (
            <p style={{ color: '#888' }}>No recent activity</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feedEvents.map((event) => {
                const userProfile = userProfiles[event.userDid];
                const userHandle = userProfile?.handle || event.userDid;
                
                return (
                  <div
                    key={event.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '8px',
                      border: '1px solid #333',
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    {/* User Avatar */}
                    <a
                      href={`/profile/${userHandle}`}
                      style={{
                        flexShrink: 0,
                        textDecoration: 'none',
                      }}
                    >
                      {userProfile?.avatar ? (
                        <img
                          src={userProfile.avatar}
                          alt={userProfile.displayName || userHandle}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #646cff',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#646cff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {(userProfile?.displayName || userHandle).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </a>

                    {/* Event Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <p style={{ margin: 0, fontWeight: '500', flex: 1 }}>
                          {renderEventName(event)}
                        </p>
                        <span style={{ color: '#888', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Welcome to Collective</h2>
      <p>Please log in to continue</p>
      <LoginButton apiUrl={apiUrl} />
    </div>
  );
}
