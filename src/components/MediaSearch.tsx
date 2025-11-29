import { useState } from 'react';

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

interface MediaSearchProps {
  apiUrl: string;
  onSelect: (result: MediaSearchResult) => void;
}

export function MediaSearch({ apiUrl, onSelect }: MediaSearchProps) {
  const [mediaType, setMediaType] = useState<'book'>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/media/search`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search');
      }

      const data = await response.json();
      console.log({data})
      setResults(data.results);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = async (result: MediaSearchResult) => {
    // If not in database yet, add it first
    if (!result.inDatabase && result.isbn) {
      try {
        const response = await fetch(`${apiUrl}/media/add`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: result.title,
            creator: result.author,
            mediaType,
            isbn: result.isbn,
            coverImage: result.coverImage,
            publishYear: result.publishYear,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          result.mediaItemId = data.mediaItemId;
          result.inDatabase = true;
        }
      } catch (err) {
        console.error('Failed to add to database:', err);
      }
    }

    onSelect(result);
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: '0 0 150px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd', fontSize: '0.875rem' }}>
              Media Type
            </label>
            <select
              value={mediaType}
              onChange={(e) => setMediaType(e.target.value as 'book')}
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
              <option value="book">Book</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ddd', fontSize: '0.875rem' }}>
              Search
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or author..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '1rem',
                }}
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: searching ? '#444' : '#646cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  cursor: searching ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                }}
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#ff444420',
          border: '1px solid #ff4444',
          borderRadius: '6px',
          color: '#ff8888',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelectResult(result)}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#646cff')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#333')}
              >
                {result.coverImage && (
                  <img
                    src={result.coverImage}
                    alt={result.title}
                    style={{
                      width: '60px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem' }}>
                    {result.title}
                  </h4>
                  {result.author && (
                    <p style={{ margin: '0 0 0.5rem 0', color: '#888', fontSize: '0.875rem' }}>
                      by {result.author}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                    {result.publishYear && <span>{result.publishYear}</span>}
                    {result.isbn && <span>ISBN: {result.isbn}</span>}
                  </div>
                  {result.inDatabase && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      {result.averageRating !== null && (
                        <span style={{ color: '#ffd700' }}>
                          ⭐ {result.averageRating.toFixed(1)} 
                        </span>
                      )}
                      <span style={{ color: '#888', marginLeft: '0.5rem' }}>
                        ({result.totalReviews} {result.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!searching && results.length === 0 && searchQuery && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#888',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
        }}>
          No results found. Try a different search.
        </div>
      )}
    </div>
  );
}
