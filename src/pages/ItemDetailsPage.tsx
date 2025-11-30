import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  totalReviews: number;
  totalSaves: number;
  averageRating: number | null;
}

interface Review {
  id: number;
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatar: string | null;
  rating: number;
  review: string;
  reviewUri: string | null;
  listItemUri: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemDetailsPageProps {
  apiUrl: string;
}

export function ItemDetailsPage({ apiUrl }: ItemDetailsPageProps) {
  const { itemId } = useParams<{ itemId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<MediaItem | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [reviewsOffset, setReviewsOffset] = useState(0);
  const navigate = useNavigate();
  const REVIEWS_PER_PAGE = 10;

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`${apiUrl}/media/${itemId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch item details');
        }

        const data = await response.json();
        setItem(data);
        setLoading(false);

        // Fetch reviews if there are any
        if (data.totalReviews > 0) {
          fetchReviews(0);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [apiUrl, itemId]);

  const fetchReviews = async (offset: number) => {
    if (!itemId) return;
    
    setReviewsLoading(true);
    try {
      const response = await fetch(
        `${apiUrl}/media/${itemId}/reviews?limit=${REVIEWS_PER_PAGE}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      
      if (offset === 0) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      setHasMoreReviews(data.hasMore);
      setReviewsOffset(offset);
      setReviewsLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch reviews:', err);
      setReviewsLoading(false);
    }
  };

  const loadMoreReviews = () => {
    fetchReviews(reviewsOffset + REVIEWS_PER_PAGE);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div>Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ color: '#ff4444' }}>Error: {error || 'Item not found'}</div>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: '#646cff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          padding: 0,
        }}
      >
        ← Back
      </button>

      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
      }}>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
          {item.coverImage && (
            <img
              src={item.coverImage}
              alt={item.title}
              style={{
                width: '200px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '8px',
                flexShrink: 0,
              }}
            />
          )}
          
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>
              {item.title}
            </h1>
            
            {item.creator && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '1.125rem' }}>
                by {item.creator}
              </p>
            )}

            {item.publishedYear && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.9375rem' }}>
                Published: {item.publishedYear}
              </p>
            )}

            {item.isbn && (
              <p style={{ margin: '0 0 1rem 0', color: '#888', fontSize: '0.875rem' }}>
                ISBN: {item.isbn}
              </p>
            )}

            {item.totalReviews > 0 && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                marginTop: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem', color: '#ffd700' }}>
                    {'⭐'.repeat(Math.floor(item.averageRating || 0))}
                    {(item.averageRating || 0) % 1 >= 0.5 && '✨'}
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                      {item.averageRating?.toFixed(1)}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.875rem' }}>
                      {item.totalReviews} {item.totalReviews === 1 ? 'review' : 'reviews'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {item.description && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>
              Description
            </h2>
            <p style={{
              margin: 0,
              color: '#ddd',
              lineHeight: '1.6',
              fontSize: '0.9375rem',
              whiteSpace: 'pre-wrap',
            }}>
              {item.description}
            </p>
          </div>
        )}

        {item.totalReviews === 0 && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            textAlign: 'center',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
          }}>
            <p style={{ margin: 0, color: '#888' }}>
              No reviews yet. Be the first to review this {item.mediaType}!
            </p>
          </div>
        )}

        {reviews.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem' }}>
              Reviews ({item.totalReviews})
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {review.authorAvatar ? (
                      <img
                        src={review.authorAvatar}
                        alt={review.authorDisplayName}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </div>
                    )}
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

                            <span
                            style={{
                                fontWeight: 'bold',
                                color: '#fff',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/profile/${review.authorHandle}`)}
                            >
                            {review.authorDisplayName}
                            </span>
                            <span
                            style={{
                                color: '#888',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/profile/${review.authorHandle}`)}
                            >
                            @{review.authorHandle}
                            </span>
                            <span style={{ color: '#666', fontSize: '0.875rem' }}>·</span>
                            <span style={{ color: '#888', fontSize: '0.875rem' }}>
                            {formatDate(review.createdAt)}
                            </span>
                        </div>
                        <div>
                            <span style={{fontSize: '1.125rem'}}>
                                {'⭐'.repeat(Math.floor(review.rating))}
                                {review.rating % 1 >= 0.5 && '✨'}
                                <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.875rem' }}>
                                    {review.rating.toFixed(1)}
                                </span>
                            </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    color: '#ddd',
                    lineHeight: '1.6',
                    fontSize: '0.9375rem',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {review.review}
                  </p>
                </div>
              ))}
            </div>

            {hasMoreReviews && (
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button
                  onClick={loadMoreReviews}
                  disabled={reviewsLoading}
                  style={{
                    padding: '0.75rem 2rem',
                    backgroundColor: reviewsLoading ? '#444' : '#646cff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: reviewsLoading ? 'not-allowed' : 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                  }}
                >
                  {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
