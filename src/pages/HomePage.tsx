import { LoginButton } from '../components/LoginButton';

interface HomePageProps {
  isAuthenticated: boolean;
  user: {
    displayName?: string;
    handle: string;
  } | null;
  apiUrl: string;
}

export function HomePage({ isAuthenticated, user, apiUrl }: HomePageProps) {
  if (isAuthenticated && user) {
    return (
      <div className="card">
        <h2>Welcome back, {user.displayName || user.handle}!</h2>
        <p>You're logged in and ready to explore.</p>
        <div style={{ marginTop: '2rem' }}>
          <a
            href="/profile"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#646cff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
            }}
          >
            View Your Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Welcome to Collective Social</h2>
      <p>Please log in to continue</p>
      <LoginButton apiUrl={apiUrl} />
    </div>
  );
}
