import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Input,
  Text,
  VStack,
  HStack,
  Heading,
} from '@chakra-ui/react';
import { Field } from './ui/field';

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
    <VStack gap={4} align="stretch" w="full">
      <form onSubmit={handleSearch}>
        <Flex gap={4} direction={{ base: 'column', sm: 'row' }} mb={4}>
          <Box flex={{ base: 'none', sm: '0 0 150px' }}>
            <Field label="Media Type">
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as 'book')}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--chakra-colors-bg-muted)',
                  border: '1px solid var(--chakra-colors-border)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: 'inherit',
                }}
              >
                <option value="book">Book</option>
              </select>
            </Field>
          </Box>

          <Box flex={1}>
            <Field label="Search">
              <HStack gap={2}>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or author..."
                  flex={1}
                />
                <Button
                  type="submit"
                  colorPalette="teal"
                  disabled={searching || !searchQuery.trim()}
                  flexShrink={0}
                >
                  {searching ? 'Searching...' : 'Search'}
                </Button>
              </HStack>
            </Field>
          </Box>
        </Flex>
      </form>

      {error && (
        <Box
          p={4}
          bg="red.500/20"
          borderWidth="1px"
          borderColor="red.500"
          borderRadius="md"
          color="red.300"
        >
          {error}
        </Box>
      )}

      {results.length > 0 && (
        <Box maxH="400px" overflowY="auto">
          <VStack gap={3} align="stretch">
            {results.map((result, index) => (
              <Flex
                key={index}
                gap={4}
                p={4}
                bg="bg.muted"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
                cursor="pointer"
                transition="border-color 0.2s"
                _hover={{ borderColor: 'teal.500' }}
                onClick={() => handleSelectResult(result)}
              >
                {result.coverImage && (
                  <img
                    src={result.coverImage}
                    alt={result.title}
                    style={{
                      width: '60px',
                      height: '90px',
                      objectFit: 'cover',
                      borderRadius: '0.375rem',
                      flexShrink: 0,
                    }}
                  />
                )}
                <VStack align="stretch" flex={1} gap={2}>
                  <Heading size="sm">{result.title}</Heading>
                  {result.author && (
                    <Text color="fg.muted" fontSize="sm">
                      by {result.author}
                    </Text>
                  )}
                  <HStack gap={4} fontSize="sm" color="fg.muted">
                    {result.publishYear && <Text>{result.publishYear}</Text>}
                    {result.isbn && <Text>ISBN: {result.isbn}</Text>}
                  </HStack>
                  {result.inDatabase && (
                    <HStack gap={2} fontSize="sm">
                      {result.averageRating !== null && (
                        <Text color="yellow.400">⭐ {result.averageRating.toFixed(1)}</Text>
                      )}
                      <Text color="fg.muted">
                        ({result.totalReviews}{' '}
                        {result.totalReviews === 1 ? 'review' : 'reviews'})
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

      {!searching && results.length === 0 && searchQuery && (
        <Box p={8} textAlign="center" color="fg.muted" bg="bg.muted" borderRadius="md">
          No results found. Try a different search.
        </Box>
      )}
    </VStack>
  );
}
