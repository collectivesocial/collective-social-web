import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  did: string;
  firstLoginAt: string;
  lastActivityAt: string;
  isAdmin: boolean;
  createdAt: string;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  totalReviews: number;
  averageRating: number | null;
  createdAt: string;
}

interface AdminPageProps {
  apiUrl: string;
}

export function AdminPage({ apiUrl }: AdminPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [totalMediaItems, setTotalMediaItems] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        // Check if user is admin
        const adminCheckRes = await fetch(`${apiUrl}/admin/check`, {
          credentials: 'include',
        });

        if (!adminCheckRes.ok) {
          throw new Error('Failed to check admin status');
        }

        const adminData = await adminCheckRes.json();

        if (!adminData.isAdmin) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Fetch users data
        const usersRes = await fetch(`${apiUrl}/admin/users`, {
          credentials: 'include',
        });

        if (!usersRes.ok) {
          throw new Error('Failed to fetch users data');
        }

        const usersData = await usersRes.json();
        setUsers(usersData.users);
        setTotalUsers(usersData.totalUsers);

        // Fetch media items data
        const mediaRes = await fetch(`${apiUrl}/admin/media`, {
          credentials: 'include',
        });

        if (!mediaRes.ok) {
          throw new Error('Failed to fetch media data');
        }

        const mediaData = await mediaRes.json();
        setMediaItems(mediaData.mediaItems);
        setTotalMediaItems(mediaData.totalMediaItems);

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [apiUrl]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444', marginBottom: '1rem' }}>
          {error || 'Access denied'}
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

      {/* Users Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ margin: 0 }}>Users</h2>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#888',
          }}>
            Total: {totalUsers}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  DID
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  First Login
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  Last Activity
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', color: '#888', fontWeight: '500' }}>
                  Admin
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr
                  key={user.did}
                  style={{
                    borderTop: index > 0 ? '1px solid #333' : 'none',
                  }}
                >
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    <a
                      href={`https://pdsls.dev/at://${user.did}`}
                      target="_blank"
                      rel="noopener noreferrer"
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
                      {user.did.substring(0, 24)}...
                    </a>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#ddd' }}>
                    {new Date(user.firstLoginAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#ddd' }}>
                    {new Date(user.lastActivityAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {user.isAdmin ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#646cff',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}>
                        YES
                      </span>
                    ) : (
                      <span style={{ color: '#666' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalUsers > 10 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#888',
            textAlign: 'center',
          }}>
            Showing 10 of {totalUsers} users
          </div>
        )}
      </section>

      {/* Media Items Section */}
      <section>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ margin: 0 }}>Media Items</h2>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#888',
          }}>
            Total: {totalMediaItems}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2a2a2a' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  ID
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  Title
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  Creator
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  Type
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', color: '#888', fontWeight: '500' }}>
                  Reviews
                </th>
                <th style={{ padding: '1rem', textAlign: 'center', color: '#888', fontWeight: '500' }}>
                  Avg Rating
                </th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontWeight: '500' }}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {mediaItems.map((item, index) => (
                <tr
                  key={item.id}
                  style={{
                    borderTop: index > 0 ? '1px solid #333' : 'none',
                  }}
                >
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#888' }}>
                    {item.id}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {item.title}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#ddd' }}>
                    {item.creator || '-'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize',
                    }}>
                      {item.mediaType}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    {item.totalReviews}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    {item.averageRating ? (
                      <span style={{ color: '#ffd700' }}>
                        ⭐ {item.averageRating.toFixed(1)}
                      </span>
                    ) : (
                      <span style={{ color: '#666' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#ddd' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalMediaItems > 10 && (
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#888',
            textAlign: 'center',
          }}>
            Showing 10 of {totalMediaItems} media items
          </div>
        )}
      </section>
    </div>
  );
}
