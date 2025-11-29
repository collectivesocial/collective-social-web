import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility?: 'public' | 'private';
  isDefault?: boolean;
  purpose: string;
  avatar: string | null;
  itemCount: number;
  createdAt: string;
}

interface CollectionsPageProps {
  apiUrl: string;
}

export function CollectionsPage({ apiUrl }: CollectionsPageProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
    purpose: 'app.collectivesocial.defs#curatelist',
  });
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
  });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/users/me`, {
        credentials: 'include',
      }),
      fetch(`${apiUrl}/collections`, {
        credentials: 'include',
      }),
    ])
      .then(async ([userRes, collectionsRes]) => {
        if (!userRes.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await userRes.json();
        const collectionsData = collectionsRes.ok
          ? await collectionsRes.json()
          : { collections: [] };

        setUser(userData);
        setCollections(collectionsData.collections);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        navigate('/');
      });
  }, [apiUrl, navigate]);

  const handleEditCollection = (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCollection(collection);
    setEditData({
      name: collection.name,
      description: collection.description || '',
      visibility: collection.visibility || 'public',
    });
    setShowEditModal(true);
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCollection) return;

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(editingCollection.uri)}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update collection');
      }

      // Refresh collections
      const collectionsRes = await fetch(`${apiUrl}/collections`, {
        credentials: 'include',
      });
      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json();
        setCollections(collectionsData.collections);
      }

      setShowEditModal(false);
      setEditingCollection(null);
    } catch (err) {
      console.error('Failed to update collection:', err);
      alert('Failed to update collection');
    }
  };

  const handleDeleteCollection = async (collection: Collection, e: React.MouseEvent) => {
    e.stopPropagation();

    if (collection.isDefault) {
      alert('Cannot delete the default Inbox list');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collection.uri)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete collection');
      }

      setCollections(collections.filter((c) => c.uri !== collection.uri));
    } catch (err: any) {
      console.error('Failed to delete collection:', err);
      alert(err.message || 'Failed to delete collection');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/collections`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      const created = await response.json();

      setCollections([
        ...collections,
        {
          ...created,
          itemCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);

      setShowCreateModal(false);
      setNewCollection({
        name: '',
        description: '',
        visibility: 'public',
        purpose: 'app.collectivesocial.defs#curatelist',
      });
    } catch (err) {
      console.error('Failed to create collection:', err);
      alert('Failed to create collection');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading collections...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error || 'Unable to load collections'}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
            Collections
          </h1>
          <p style={{ color: '#888', margin: 0 }}>
            Curated groups of content from {user.displayName || user.handle}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '500',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#535bf2')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#646cff')}
        >
          + New Collection
        </button>
      </div>

      {collections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#1a1a1a',
          border: '2px dashed #333',
          borderRadius: '12px',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            opacity: 0.5,
          }}>
            📚
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#888' }}>
            No collections yet
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            Collections let you organize and curate media like books, movies, and blog posts.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {collections.map((collection) => (
            <div
              key={collection.uri}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = '#646cff')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = '#333')}
              onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, flex: 1 }}>
                  {collection.name}
                  {collection.isDefault && (
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#646cff20',
                      color: '#646cff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      marginLeft: '0.5rem'
                    }}>
                      Default
                    </span>
                  )}
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {collection.visibility === 'private' && (
                    <span style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#333',
                      color: '#888',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                    }}>
                      🔒 Private
                    </span>
                  )}
                  <button
                    onClick={(e) => handleEditCollection(collection, e)}
                    style={{
                      background: 'none',
                      border: '1px solid #646cff',
                      color: '#646cff',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                    title="Edit collection"
                  >
                    Edit
                  </button>
                  {!collection.isDefault && (
                    <button
                      onClick={(e) => handleDeleteCollection(collection, e)}
                      style={{
                        background: 'none',
                        border: '1px solid #ff4444',
                        color: '#ff4444',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                      title="Delete collection"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              {collection.description && (
                <p style={{ color: '#888', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
                  {collection.description}
                </p>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem',
                color: '#666'
              }}>
                <span>{collection.itemCount} items</span>
                <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              margin: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Create New Collection</h2>
            <form onSubmit={handleCreateCollection}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                  placeholder="e.g., Books to Read"
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Description
                </label>
                <textarea
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                  placeholder="Describe your collection..."
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Visibility
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={newCollection.visibility === 'public'}
                      onChange={(e) => setNewCollection({ ...newCollection, visibility: e.target.value as 'public' | 'private' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Public - Visible on your profile</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={newCollection.visibility === 'private'}
                      onChange={(e) => setNewCollection({ ...newCollection, visibility: e.target.value as 'public' | 'private' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Private - Only visible to you</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#ddd',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#646cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && editingCollection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              margin: '1rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>
              Edit Collection
              {editingCollection.isDefault && (
                <span style={{
                  fontSize: '0.875rem',
                  color: '#888',
                  fontWeight: 'normal',
                  marginLeft: '0.5rem'
                }}>
                  (Default list cannot be deleted)
                </span>
              )}
            </h2>
            <form onSubmit={handleUpdateCollection}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '1rem',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Visibility
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editVisibility"
                      value="public"
                      checked={editData.visibility === 'public'}
                      onChange={(e) => setEditData({ ...editData, visibility: e.target.value as 'public' | 'private' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Public</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="editVisibility"
                      value="private"
                      checked={editData.visibility === 'private'}
                      onChange={(e) => setEditData({ ...editData, visibility: e.target.value as 'public' | 'private' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Private</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'transparent',
                    color: '#ddd',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#646cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
