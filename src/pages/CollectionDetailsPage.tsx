import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaSearch } from '../components/MediaSearch';

interface MediaSearchResult {
  title: string;
  author: string | null;
  publishYear: number | null;
  isbn: string | null;
  coverImage: string | null;
  inDatabase: boolean;
  totalReviews: number;
  averageRating: number | null;
  mediaItemId: number | null;
}

interface Recommendation {
  did: string;
  suggestedAt: string;
  handle?: string;
}

interface ListItem {
  uri: string;
  cid: string;
  title: string;
  creator: string | null;
  mediaType: string | null;
  mediaItemId: number | null;
  status: string | null;
  rating: number | null;
  review: string | null;
  recommendations: Recommendation[];
  createdAt: string;
  mediaItem?: {
    id: number;
    isbn: string | null;
    externalId: string | null;
    coverImage: string | null;
    description: string | null;
    publishedYear: number | null;
    totalReviews: number;
    averageRating: number | null;
  };
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility: string;
}

interface CollectionDetailsPageProps {
  apiUrl: string;
}

export function CollectionDetailsPage({ apiUrl }: CollectionDetailsPageProps) {
  const { collectionUri } = useParams<{ collectionUri: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserDid, setCurrentUserDid] = useState<string | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [recommenderHandles, setRecommenderHandles] = useState<Record<string, string>>({});
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaSearchResult | null>(null);
  const [reviewData, setReviewData] = useState({
    status: 'want',
    rating: 0,
    review: '',
    recommendedBy: '',
  });
  const [editData, setEditData] = useState({
    rating: 0,
    review: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth and get current user
        const authRes = await fetch(`${apiUrl}/users/me`, {
          credentials: 'include',
        });
        if (!authRes.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await authRes.json();
        setCurrentUserDid(userData.did);

        // Fetch all collections to find this one
        const collectionsRes = await fetch(`${apiUrl}/collections`, {
          credentials: 'include',
        });
        if (!collectionsRes.ok) {
          throw new Error('Failed to fetch collections');
        }
        const collectionsData = await collectionsRes.json();
        const foundCollection = collectionsData.collections.find(
          (c: Collection) => c.uri === decodeURIComponent(collectionUri!)
        );
        if (foundCollection) {
          setCollection(foundCollection);
        }

        // Fetch items
        const itemsRes = await fetch(
          `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
          {
            credentials: 'include',
          }
        );
        if (!itemsRes.ok) {
          throw new Error('Failed to fetch items');
        }
        const itemsData = await itemsRes.json();
        setItems(itemsData.items);

        // Resolve all recommender DIDs to handles
        const allDids = new Set<string>();
        itemsData.items.forEach((item: ListItem) => {
          item.recommendations?.forEach((rec) => {
            allDids.add(rec.did);
          });
        });

        // Fetch handles for all DIDs
        const handleMap: Record<string, string> = {};
        await Promise.all(
          Array.from(allDids).map(async (did) => {
            try {
              const profileRes = await fetch(
                `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
              );
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                handleMap[did] = profileData.handle;
              }
            } catch (err) {
              console.warn(`Failed to resolve handle for ${did}`);
            }
          })
        );
        setRecommenderHandles(handleMap);

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
        if (err.message === 'Not authenticated') {
          navigate('/');
        }
      }
    };

    fetchData();
  }, [apiUrl, navigate, collectionUri]);

  const isOwner = () => {
    if (!currentUserDid || !collectionUri) return false;
    const decodedUri = decodeURIComponent(collectionUri);
    const didMatch = decodedUri.match(/^at:\/\/([^\/]+)/);
    return didMatch && didMatch[1] === currentUserDid;
  };

  const handleMediaSelect = (media: MediaSearchResult) => {
    setSelectedMedia(media);
  };

  const handleEditItem = (item: ListItem) => {
    setEditingItem(item);
    setEditData({
      rating: item.rating || 0,
      review: item.review || '',
    });
    setShowEditItemModal(true);
  };

  const handleDeleteItem = async (itemUri: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items/${encodeURIComponent(itemUri)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Refresh items list
      const itemsRes = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
        {
          credentials: 'include',
        }
      );
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      alert('Failed to delete item from collection');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem) return;

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items/${encodeURIComponent(editingItem.uri)}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: editData.rating,
            review: editData.review,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      setShowEditItemModal(false);
      setEditingItem(null);
      setEditData({
        rating: 0,
        review: '',
      });

      // Refresh items list
      const itemsRes = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
        {
          credentials: 'include',
        }
      );
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items);
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to update item');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMedia) {
      alert('Please select a media item first');
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: selectedMedia.title,
            creator: selectedMedia.author,
            mediaType: 'book',
            mediaItemId: selectedMedia.mediaItemId,
            status: reviewData.status,
            rating: reviewData.rating,
            review: reviewData.review,
            recommendedBy: reviewData.recommendedBy || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      setShowAddItemModal(false);
      setSelectedMedia(null);
      setReviewData({
        status: 'want',
        rating: 0,
        review: '',
        recommendedBy: '',
      });
      
      // Refresh items list
      const itemsRes = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items`,
        {
          credentials: 'include',
        }
      );
      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData.items);
      }
    } catch (err) {
      console.error('Failed to add item:', err);
      alert('Failed to add item to collection');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading collection...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error}</div>
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
          <button
            onClick={() => navigate('/collections')}
            style={{
              background: 'none',
              border: 'none',
              color: '#646cff',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '0.5rem',
              padding: 0,
            }}
          >
            ← Back to Collections
          </button>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>
            {collection?.name || 'Collection'}
          </h1>
          {collection?.description && (
            <p style={{ color: '#888', marginTop: '0.5rem', marginBottom: 0 }}>
              {collection.description}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAddItemModal(true)}
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
          + Add Item
        </button>
      </div>

      {items.length === 0 ? (
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
            📝
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#888' }}>
            No items yet
          </h3>
          <p style={{ color: '#666', margin: 0 }}>
            Add your first item to start tracking and reviewing.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map((item) => (
            <div
              key={item.uri}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '12px',
                padding: '1.5rem',
                display: 'flex',
                gap: '1.5rem',
              }}
            >
              {item.mediaItem?.coverImage && (
                <img
                  src={item.mediaItem.coverImage}
                  alt={item.title}
                  onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
                  style={{
                    width: '80px',
                    height: '120px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    flexShrink: 0,
                    cursor: item.mediaItemId ? 'pointer' : 'default',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <div>
                    <h3 
                      onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
                      style={{ 
                        margin: '0 0 0.25rem 0', 
                        fontSize: '1.25rem',
                        cursor: item.mediaItemId ? 'pointer' : 'default',
                        color: item.mediaItemId ? '#646cff' : 'inherit',
                      }}
                    >
                      {item.title}
                    </h3>
                    {item.creator && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.875rem' }}>
                        by {item.creator}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {item.status && (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#2a2a2a',
                        color: '#888',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.status.replace('-', ' ')}
                      </span>
                    )}
                    {isOwner() && (
                      <>
                        <button
                          onClick={() => handleEditItem(item)}
                          style={{
                            background: 'none',
                            border: '1px solid #646cff',
                            color: '#646cff',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          title="Edit item"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.uri)}
                          style={{
                            background: 'none',
                            border: '1px solid #ff4444',
                            color: '#ff4444',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          title="Delete item"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {item.rating !== null && item.rating > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#ffd700', fontSize: '0.875rem' }}>
                      {'⭐'.repeat(Math.floor(item.rating))}
                      {item.rating % 1 !== 0 && '✨'}
                    </span>
                    <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.875rem' }}>
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {item.review && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#ddd', fontSize: '0.9375rem', lineHeight: '1.5' }}>
                    {item.review}
                  </p>
                )}

                {item.mediaItem && item.mediaItem.totalReviews > 1 && (
                  <div 
                    onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
                    style={{ 
                      marginTop: '0.75rem', 
                      paddingTop: '0.75rem', 
                      borderTop: '1px solid #333',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ color: '#888', fontSize: '0.75rem' }}>
                      Community: ⭐ {item.mediaItem.averageRating?.toFixed(1)} ({item.mediaItem.totalReviews} reviews)
                    </span>
                  </div>
                )}

                {item.recommendations && item.recommendations.length > 0 && (
                  <div style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #333',
                  }}>
                    <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      💡 Recommended by:
                    </div>
                    {item.recommendations.map((rec, idx) => (
                      <div key={idx} style={{ marginLeft: '1rem', marginTop: '0.25rem' }}>
                        <a
                          href={`https://bsky.app/profile/${rec.did}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#646cff',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                          }}
                        >
                          @{recommenderHandles[rec.did] || rec.did.substring(0, 24) + '...'}
                        </a>
                        <span style={{ color: '#666', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                          ({new Date(rec.suggestedAt).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>
                    Added {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
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
        onClick={() => setShowAddItemModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              margin: '1rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Add Item to Collection</h2>
            
            {!selectedMedia ? (
              <div>
                <p style={{ color: '#888', marginBottom: '1.5rem' }}>
                  Search for a book to add to your collection
                </p>
                <MediaSearch apiUrl={apiUrl} onSelect={handleMediaSelect} />
              </div>
            ) : (
              <form onSubmit={handleAddItem}>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                }}>
                  {selectedMedia.coverImage && (
                    <img
                      src={selectedMedia.coverImage}
                      alt={selectedMedia.title}
                      style={{
                        width: '60px',
                        height: '90px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.25rem 0' }}>{selectedMedia.title}</h3>
                    {selectedMedia.author && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.875rem' }}>
                        by {selectedMedia.author}
                      </p>
                    )}
                    {selectedMedia.inDatabase && selectedMedia.totalReviews > 0 && (
                      <div style={{ fontSize: '0.875rem' }}>
                        <span style={{ color: '#ffd700' }}>
                          ⭐ {selectedMedia.averageRating?.toFixed(1)}
                        </span>
                        <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                          ({selectedMedia.totalReviews} {selectedMedia.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMedia(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#888',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      padding: '0',
                    }}
                  >
                    ×
                  </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                    Status
                  </label>
                  <select
                    value={reviewData.status}
                    onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem',
                    }}
                  >
                    <option value="want">Want to Read</option>
                    <option value="in-progress">Currently Reading</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                    Rating (0-5 stars)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '1.5rem',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          opacity: star <= reviewData.rating ? 1 : 0.3,
                        }}
                      >
                        {star % 1 === 0 ? '⭐' : '✨'}
                      </button>
                    ))}
                    <span style={{ marginLeft: '0.5rem', color: '#888' }}>
                      {reviewData.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                    Review/Notes
                  </label>
                  <textarea
                    value={reviewData.review}
                    onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                    rows={4}
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
                    placeholder="Your thoughts and notes..."
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                    Recommended by (optional)
                  </label>
                  <input
                    type="text"
                    value={reviewData.recommendedBy}
                    onChange={(e) => setReviewData({ ...reviewData, recommendedBy: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '1rem',
                    }}
                    placeholder="did:plc:xxx or handle.bsky.social"
                  />
                  <p style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                    Enter the DID or handle of who recommended this to you
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
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
                    Add Item
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItemModal && editingItem && (
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
        onClick={() => setShowEditItemModal(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '600px',
              width: '100%',
              margin: '1rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 1.5rem 0' }}>Edit Item</h2>
            
            <form onSubmit={handleUpdateItem}>
              <div style={{
                display: 'flex',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginBottom: '1.5rem',
              }}>
                {editingItem.mediaItem?.coverImage && (
                  <img
                    src={editingItem.mediaItem.coverImage}
                    alt={editingItem.title}
                    style={{
                      width: '60px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0' }}>{editingItem.title}</h3>
                  {editingItem.creator && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.875rem' }}>
                      by {editingItem.creator}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Rating (0-5 stars)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditData({ ...editData, rating: star })}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        opacity: star <= editData.rating ? 1 : 0.3,
                      }}
                    >
                      {star % 1 === 0 ? '⭐' : '✨'}
                    </button>
                  ))}
                  <span style={{ marginLeft: '0.5rem', color: '#888' }}>
                    {editData.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd' }}>
                  Review/Notes
                </label>
                <textarea
                  value={editData.review}
                  onChange={(e) => setEditData({ ...editData, review: e.target.value })}
                  rows={4}
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
                  placeholder="Your thoughts and notes..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditItemModal(false)}
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
