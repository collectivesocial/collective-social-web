import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface HeaderProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  apiUrl: string;
}

export function Header({ user, isAuthenticated, apiUrl }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: isAuthenticated ? '60px' : 'auto',
      backgroundColor: '#1a1a1a',
      borderBottom: '1px solid #333',
      zIndex: 1000,
      transition: 'height 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: isAuthenticated ? '0 2rem' : '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1 style={{
              margin: 0,
              fontSize: isAuthenticated ? '1.5rem' : '2.5rem',
              transition: 'font-size 0.3s ease',
            }}>
              Collective Social
            </h1>
          </Link>
          
          {isAuthenticated && (
            <nav style={{ display: 'flex', gap: '1.5rem' }}>
              <Link
                to="/"
                style={{
                  color: '#ddd',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#646cff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#ddd'}
              >
                Home
              </Link>
              <Link
                to="/profile"
                style={{
                  color: '#ddd',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#646cff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#ddd'}
              >
                Profile
              </Link>
            </nav>
          )}
        </div>

        {isAuthenticated && user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.displayName || user.handle}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #646cff',
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#646cff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                  {(user.displayName || user.handle).charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                backgroundColor: '#2a2a2a',
                border: '1px solid #333',
                borderRadius: '8px',
                minWidth: '200px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}>
                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    borderBottom: '1px solid #333',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    {user.displayName || user.handle}
                  </div>
                  <div style={{ color: '#888', fontSize: '0.875rem' }}>
                    @{user.handle}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    color: '#ff4444',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
