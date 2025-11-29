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

export function HomePage({ isAuthenticated, user, apiUrl }: HomePageProps) {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch feed events
    fetch(`${apiUrl}/feed/events?limit=20`)
      .then((res) => res.json())
      .then((data) => {
        setFeedEvents(data.events);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load feed events:', err);
        setLoading(false);
      });
  }, [apiUrl]);

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
              {feedEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    border: '1px solid #333',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ margin: 0, fontWeight: '500' }}>{event.eventName}</p>
                    <span style={{ color: '#888', fontSize: '0.875rem' }}>
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {event.mediaLink && (
                    <a
                      href={event.mediaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#646cff',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem',
                        display: 'inline-block',
                      }}
                    >
                      View media
                    </a>
                  )}
                </div>
              ))}
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
