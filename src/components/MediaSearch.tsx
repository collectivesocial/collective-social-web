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
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogBackdrop, DialogPositioner } from './ui/dialog';
import { Field } from './ui/field';
import { StarRating } from './StarRating';
import { AddMediaModal } from './AddMediaModal';

export interface MediaSearchResult {
  title: string;
  author: string | null;
  publishYear: number | null;
  isbn: string | null;
  coverImage: string | null;
  pages?: number | null;
  inDatabase: boolean;
  totalRatings: number;
  totalReviews: number;
  averageRating: number | null;
  mediaItemId: number | null;
  url?: string;
  mediaType?: string;
  imdbId?: string;
}

interface MediaSearchProps {
  apiUrl: string;
  onSelect: (result: MediaSearchResult) => void;
}

export function MediaSearch({ apiUrl, onSelect }: MediaSearchProps) {
  const [mediaType, setMediaType] = useState<'book' | 'article' | 'video' | 'movie' | 'tv' | 'course'>('book');
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleCount, setModuleCount] = useState('');
  const [showModulePrompt, setShowModulePrompt] = useState(false);
  const [pendingCourseResult, setPendingCourseResult] = useState<MediaSearchResult | null>(null);
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    setError(null);
    setHasSearched(false);

    try {
      // For articles, videos, and courses, use link endpoint
      if (mediaType === 'article' || mediaType === 'video' || mediaType === 'course') {
        const response = await fetch(`${apiUrl}/media/link`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchQuery,
            mediaType,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch link metadata');
        }

        const data = await response.json();
        // Show single result
        setResults([data]);
      } else {
        // For books, use search endpoint
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
      }
    } catch (err) {
      setError(
        mediaType === 'article' || mediaType === 'video' || mediaType === 'course'
          ? 'Failed to fetch link metadata. Please check the URL and try again.'
          : 'Failed to search. Please try again.'
      );
      console.error(err);
    } finally {
      setSearching(false);
      setHasSearched(true);
    }
  };

  const handleSelectResult = async (result: MediaSearchResult) => {
    // For courses not in database, prompt for module count first
    if (!result.inDatabase && result.mediaType === 'course') {
      setPendingCourseResult(result);
      setShowModulePrompt(true);
      return;
    }

    // If not in database yet, add it first
    if (!result.inDatabase) {
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
            mediaType: result.mediaType || mediaType,
            isbn: result.isbn,
            imdbId: result.imdbId,
            url: result.url,
            coverImage: result.coverImage,
            publishYear: result.publishYear,
            length: result.pages,
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
                onChange={(e) => {
                  setMediaType(e.target.value as 'book' | 'article' | 'video' | 'movie' | 'tv' | 'course');
                  setSearchQuery('');
                  setModuleCount('');
                  setShowModulePrompt(false);
                  setPendingCourseResult(null);
                  setResults([]);
                  setError(null);
                  setHasSearched(false);
                }}
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
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
              </select>
            </Field>
          </Box>

          <Box flex={1}>
            <Field label={(mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv') ? 'Search' : 'Add'}>
              <HStack gap={2}>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv'
                      ? 'Search by title...'
                      : 'Paste URL...'
                  }
                  flex={1}
                />
                <Button
                  type="submit"
                  colorPalette="teal"
                  disabled={searching || !searchQuery.trim()}
                  flexShrink={0}
                >
                  {searching
                    ? (mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv')
                      ? 'Searching...'
                      : 'Loading...'
                    : (mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv')
                    ? 'Search'
                    : 'Add'}
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
        <>
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
                      {result.pages && <Text>{result.pages} pages</Text>}
                      {result.isbn && <Text>ISBN: {result.isbn}</Text>}
                    </HStack>
                    {result.inDatabase && (
                      <HStack gap={2} fontSize="sm">
                        {result.averageRating !== null && (
                          <>
                            <StarRating rating={result.averageRating} size="1em" />
                            <Text color="fg.muted">
                              {result.averageRating.toFixed(1)}
                            </Text>
                          </>
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
          
          {/* Add Media Button after results */}
          <Box textAlign="center" pt={4} borderTopWidth="1px" borderColor="border">
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
              colorPalette="teal"
              size="lg"
            >
              Not finding what you're looking for? Add it!
            </Button>
          </Box>
        </>
      )}

      {hasSearched && !searching && results.length === 0 && searchQuery && !error && (
        <Box p={8} textAlign="center" color="fg.muted" bg="bg.muted" borderRadius="md">
          No results found. Try a different search.
        </Box>
      )}

      {/* Add Media Button */}
      {hasSearched && !searching && searchQuery && (
        <Box textAlign="center" pt={4} borderTopWidth="1px" borderColor="border">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            colorPalette="teal"
            bg="transparent"
            size="lg"
          >
            Not finding what you're looking for? Add it!
          </Button>
        </Box>
      )}

      {/* Add Media Modal */}
      <AddMediaModal
        apiUrl={apiUrl}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(mediaItemId) => {
          setShowAddModal(false);
          // Optionally trigger parent callback with the new item
          onSelect({
            title: '',
            author: null,
            publishYear: null,
            isbn: null,
            coverImage: null,
            inDatabase: true,
            totalRatings: 0,
            totalReviews: 0,
            averageRating: null,
            mediaItemId,
          });
        }}
      />

      {/* Module Count Dialog for Courses */}
      <DialogRoot open={showModulePrompt} onOpenChange={(e) => setShowModulePrompt(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How many modules?</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Field label="Number of Modules">
                <Input
                  type="number"
                  value={moduleCount}
                  onChange={(e) => setModuleCount(e.target.value)}
                  placeholder="Enter number of modules"
                  min="1"
                  autoFocus
                />
              </Field>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button
                  onClick={() => {
                    setShowModulePrompt(false);
                    setPendingCourseResult(null);
                    setModuleCount('');
                  }}
                  variant="outline"
                  bg="transparent"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!pendingCourseResult || !moduleCount) return;

                    try {
                      const response = await fetch(`${apiUrl}/media/add`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          title: pendingCourseResult.title,
                          creator: pendingCourseResult.author,
                          mediaType: 'course',
                          url: pendingCourseResult.url,
                          coverImage: pendingCourseResult.coverImage,
                          publishYear: pendingCourseResult.publishYear,
                          length: parseInt(moduleCount),
                        }),
                      });

                      if (!response.ok) {
                        throw new Error('Failed to add course');
                      }

                      const data = await response.json();
                      
                      // Update the result with the new mediaItemId and call onSelect
                      onSelect({
                        ...pendingCourseResult,
                        mediaItemId: data.mediaItemId,
                        inDatabase: true,
                      });

                      // Close dialog and reset
                      setShowModulePrompt(false);
                      setPendingCourseResult(null);
                      setModuleCount('');
                    } catch (err) {
                      console.error('Failed to add course:', err);
                      alert('Failed to add course. Please try again.');
                    }
                  }}
                  colorPalette="teal"
                  variant="outline"
                  bg="transparent"
                  disabled={!moduleCount || parseInt(moduleCount) < 1}
                >
                  Add Course
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </VStack>
  );
}
