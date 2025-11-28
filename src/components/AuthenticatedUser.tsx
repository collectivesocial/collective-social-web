import { useEffect, useState } from 'react';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface AuthenticatedUserProps {
  apiUrl?: string;
}

export function AuthenticatedUser({ apiUrl = 'http://127.0.0.1:3000' }: AuthenticatedUserProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include', // Important: send cookies
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [apiUrl]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem',
      padding: '1rem',
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      {user.avatar && (
        <img 
          src={user.avatar} 
          alt={user.displayName || user.handle}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      )}
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold' }}>
          {user.displayName || user.handle}
        </div>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          @{user.handle}
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Logout
      </button>
    </div>
  );
}
