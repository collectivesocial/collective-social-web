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

interface Feedback {
  id: number;
  userDid: string | null;
  email: string | null;
  message: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  userHandle?: string;
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
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
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

        // Fetch feedback data
        const feedbackRes = await fetch(`${apiUrl}/feedback`, {
          credentials: 'include',
        });

        if (!feedbackRes.ok) {
          throw new Error('Failed to fetch feedback data');
        }

        const feedbackData = await feedbackRes.json();
        
        // Fetch user handles for feedback items with userDid
        const feedbackWithHandles = await Promise.all(
          feedbackData.feedback.map(async (item: Feedback) => {
            if (item.userDid) {
              try {
                const profileRes = await fetch(
                  `https://public.api.bsky.app/xrpc/com.atproto.repo.describeRepo?repo=${item.userDid}`
                );
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  return { ...item, userHandle: profileData.handle };
                }
              } catch (err) {
                console.error('Failed to fetch handle for', item.userDid);
              }
            }
            return item;
          })
        );
        
        // Sort feedback: new first, then in-progress, then wont-fix, completed last
        const statusOrder: { [key: string]: number } = {
          'new': 0,
          'in-progress': 1,
          'wont-fix': 2,
          'completed': 3,
        };
        
        const sortedFeedback = feedbackWithHandles.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 4;
          const orderB = statusOrder[b.status] ?? 4;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If same status, sort by date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setFeedback(sortedFeedback);

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [apiUrl]);

  const handleEditFeedback = (feedbackItem: Feedback) => {
    setEditingFeedback(feedbackItem.id);
    setFeedbackStatus(feedbackItem.status);
    setFeedbackNotes(feedbackItem.adminNotes || '');
  };

  const handleSaveFeedback = async (feedbackId: number) => {
    try {
      const response = await fetch(`${apiUrl}/feedback/${feedbackId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: feedbackStatus,
          adminNotes: feedbackNotes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      // Update local state
      setFeedback(feedback.map(f => 
        f.id === feedbackId 
          ? { ...f, status: feedbackStatus, adminNotes: feedbackNotes || null, updatedAt: new Date().toISOString() }
          : f
      ));
      
      setEditingFeedback(null);
      setFeedbackStatus('');
      setFeedbackNotes('');
    } catch (err) {
      console.error('Failed to update feedback:', err);
      alert('Failed to update feedback');
    }
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setFeedbackStatus('');
    setFeedbackNotes('');
  };

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

      {/* Feedback Section */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ margin: 0 }}>User Feedback</h2>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#888',
          }}>
            Total: {feedback.length}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {feedback.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '1.5rem',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', color: '#ddd', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#888' }}>#{item.id}</span>
                    <span style={{ color: '#555' }}>•</span>
                    <span style={{ color: '#888' }}>{new Date(item.createdAt).toLocaleString()}</span>
                    {item.userDid && (
                      <>
                        <span style={{ color: '#555' }}>•</span>
                        {item.userHandle ? (
                          <a
                            href={`/profile/${item.userHandle}`}
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
                            @{item.userHandle}
                          </a>
                        ) : (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {item.userDid.substring(0, 20)}...
                          </span>
                        )}
                      </>
                    )}
                    {!item.userDid && item.email && (
                      <>
                        <span style={{ color: '#555' }}>•</span>
                        <span>{item.email}</span>
                      </>
                    )}
                  </div>
                </div>
                {editingFeedback !== item.id && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: item.status === 'new' ? '#e74c3c' : item.status === 'in-progress' ? '#f39c12' : '#2ecc71',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap',
                  }}>
                    {item.status}
                  </span>
                )}
              </div>

              {editingFeedback === item.id ? (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd', fontSize: '0.875rem' }}>
                      Status
                    </label>
                    <select
                      value={feedbackStatus}
                      onChange={(e) => setFeedbackStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem',
                      }}
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="wont-fix">Won't Fix</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd', fontSize: '0.875rem' }}>
                      Admin Notes
                    </label>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                      }}
                      placeholder="Add internal notes about this feedback..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSaveFeedback(item.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        color: '#ddd',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#ddd',
                      marginBottom: '0.5rem',
                    }}>
                      <strong style={{ color: '#888', fontSize: '0.75rem' }}>Feedback:</strong>{' '}
                      <span style={{ whiteSpace: 'pre-wrap' }}>{item.message}</span>
                    </div>
                    {item.adminNotes && (
                      <div style={{
                        fontSize: '0.875rem',
                        color: '#ddd',
                      }}>
                        <strong style={{ color: '#888', fontSize: '0.75rem' }}>Admin Notes:</strong>{' '}
                        <span style={{ whiteSpace: 'pre-wrap' }}>{item.adminNotes}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleEditFeedback(item)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#646cff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}

          {feedback.length === 0 && (
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              color: '#888',
            }}>
              No feedback submitted yet
            </div>
          )}
        </div>
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
