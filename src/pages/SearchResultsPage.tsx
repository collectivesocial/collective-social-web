import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
  HStack,
  Button,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { LuChevronLeft, LuChevronRight, LuBook } from 'react-icons/lu';
import { StarRating } from '../components/StarRating';
import { EmptyState } from '../components/EmptyState';
import { AddMediaModal } from '../components/AddMediaModal';

interface MediaSearchResult {
  title: string;
  author: string | null;
  publishYear: number | null;
  isbn: string | null;
  coverImage: string | null;
  inDatabase: boolean;
  totalRatings: number;
  totalReviews: number;
  averageRating: number | null;
  mediaItemId: number | null;
}

interface SearchResultsPageProps {
  apiUrl: string;
}

const RESULTS_PER_PAGE = 10;

export function SearchResultsPage({ apiUrl }: SearchResultsPageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const mediaType = searchParams.get('type') || 'book';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * RESULTS_PER_PAGE;
        const response = await fetch(`${apiUrl}/media/search`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            mediaType,
            limit: RESULTS_PER_PAGE,
            offset,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to search');
        }

        const data = await response.json();
        setResults(data.results);
        setTotalResults(data.total || data.results.length);

        // Auto-add items to database
        for (const result of data.results) {
          if (!result.inDatabasen) {
            try {
              await fetch(`${apiUrl}/media/add`, {
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
            } catch (err) {
              console.error('Failed to add item to database:', err);
            }
          }
        }
      } catch (err) {
        setError('Failed to search. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, mediaType, page, apiUrl]);

  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    navigate(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResultClick = (result: MediaSearchResult) => {
    if (result.mediaItemId) {
      navigate(`/items/${result.mediaItemId}`);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center py={12}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Searching...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (!query) {
    return (
      <Container maxW="container.xl" py={8}>
        <EmptyState
          title="No search query"
          description="Enter a search term in the header to find media items"
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box
          p={6}
          bg="red.500/10"
          borderWidth="1px"
          borderColor="red.500/30"
          borderRadius="xl"
          color="fg.error"
        >
          {error}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={2} fontFamily="heading">
            Search Results
          </Heading>
          <Text color="fg.muted" fontSize="md">
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </Text>
        </Box>

        {results.length === 0 ? (
          <EmptyState
            title="No results found"
            description="Try a different search term or media type"
          />
        ) : (
          <>
            <VStack gap={4} align="stretch">
              {results.map((result, index) => (
                <Flex
                  key={index}
                  gap={4}
                  p={4}
                  bg="bg.card"
                  borderWidth="1px"
                  borderColor="border.card"
                  borderRadius="xl"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: 'border.focus',
                    transform: 'translateY(-2px)',
                    shadow: 'md',
                  }}
                  onClick={() => handleResultClick(result)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleResultClick(result);
                    }
                  }}
                >
                  <Box flexShrink={0}>
                    {result.coverImage ? (
                      <Image
                        src={result.coverImage}
                        alt={result.title}
                        width="80px"
                        height="120px"
                        objectFit="cover"
                        borderRadius="lg"
                      />
                    ) : (
                      <Flex
                        w="80px"
                        h="120px"
                        bg="bg.muted"
                        borderWidth="1px"
                        borderColor="border"
                        borderRadius="md"
                        align="center"
                        justify="center"
                        color="fg.muted"
                      >
                        <LuBook size={32} />
                      </Flex>
                    )}
                  </Box>
                  <VStack align="stretch" flex={1} gap={2}>
                    <Heading size="md" fontFamily="heading">{result.title}</Heading>
                    {result.author && (
                      <Text color="fg.muted" fontSize="sm">
                        by {result.author}
                      </Text>
                    )}
                    <HStack gap={4} fontSize="sm" color="fg.muted" flexWrap="wrap">
                      {result.publishYear && <Text>{result.publishYear}</Text>}
                      {result.isbn && <Text>ISBN: {result.isbn}</Text>}
                    </HStack>
                    {result.inDatabase && result.averageRating !== null && (
                      <HStack gap={2} fontSize="sm" mt={1}>
                        <StarRating rating={result.averageRating} size="1em" />
                        <Text color="fg.muted">
                          {result.averageRating.toFixed(1)} ({result.totalReviews}{' '}
                          {result.totalReviews === 1 ? 'review' : 'reviews'})
                        </Text>
                      </HStack>
                    )}
                    {!result.inDatabase && (
                      <Text fontSize="xs" color="accent.default" fontWeight="medium">
                        New to Collective
                      </Text>
                    )}
                  </VStack>
                </Flex>
              ))}
            </VStack>

            {totalPages > 1 && (
              <Flex justify="center" align="center" gap={4} mt={6}>
                <Button
                  size="sm"
                  variant="outline"
                  bg="transparent"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <Flex align="center" gap={1}>
                    <LuChevronLeft />
                    Previous
                  </Flex>
                </Button>
                <Text fontSize="sm" color="fg.muted">
                  Page {page} of {totalPages}
                </Text>
                <Button
                  size="sm"
                  variant="outline"
                  bg="transparent"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <Flex align="center" gap={1}>
                    Next
                    <LuChevronRight />
                  </Flex>
                </Button>
              </Flex>
            )}

            {/* Add Media Button */}
            <Box textAlign="center" pt={6} borderTopWidth="1px" borderColor="border">
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                colorPalette="accent"
                bg="transparent"
                size="lg"
              >
                Not finding what you're looking for? Add it!
              </Button>
            </Box>
          </>
        )}
      </VStack>

      {/* Add Media Modal */}
      <AddMediaModal
        apiUrl={apiUrl}
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(mediaItemId) => {
          setShowAddModal(false);
          navigate(`/items/${mediaItemId}`);
        }}
      />
    </Container>
  );
}
