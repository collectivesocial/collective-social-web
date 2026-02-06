import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
  Spinner,
  Center,
  Badge,
  Button,
} from '@chakra-ui/react';
import { LuTag } from 'react-icons/lu';
import { StarRating } from '../components/StarRating';
import { EmptyState } from '../components/EmptyState';

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  totalRatings: number;
  totalReviews: number;
  averageRating: number | null;
  tagCount?: number;
}

interface TagSearchPageProps {
  apiUrl: string;
}

export function TagSearchPage({ apiUrl }: TagSearchPageProps) {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const sortBy = searchParams.get('sort') || 'relevant';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [tagName, setTagName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTagItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${apiUrl}/tags/${tagSlug}/items?sort=${sortBy}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch items for tag');
        }

        const data = await response.json();
        setItems(data.items);
        setTagName(data.tagName);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch tag items:', err);
        setError('Failed to load items for this tag');
        setLoading(false);
      }
    };

    if (tagSlug) {
      fetchTagItems();
    }
  }, [apiUrl, tagSlug, sortBy]);

  const handleSortChange = (newSort: string) => {
    setSearchParams({ sort: newSort });
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Loading items...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <Center minH="50vh">
          <Text color="fg.error">{error}</Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Flex align="center" gap={3} mb={2}>
            <LuTag size={32} />
            <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading">
              Tag: <Badge colorPalette="accent" fontSize="inherit">{tagName}</Badge>
            </Heading>
          </Flex>
          <Text color="fg.muted">
            {items.length} {items.length === 1 ? 'item' : 'items'} tagged with "{tagName}"
          </Text>
        </Box>

        <Flex gap={2} wrap="wrap">
          <Button
            size="sm"
            colorPalette={sortBy === 'relevant' ? 'accent' : 'gray'}
            variant={sortBy === 'relevant' ? 'solid' : 'outline'}
            onClick={() => handleSortChange('relevant')}
          >
            Most Relevant
          </Button>
          <Button
            size="sm"
            colorPalette={sortBy === 'rating' ? 'accent' : 'gray'}
            variant={sortBy === 'rating' ? 'solid' : 'outline'}
            onClick={() => handleSortChange('rating')}
          >
            Highest Rated
          </Button>
        </Flex>

        {items.length === 0 ? (
          <EmptyState
            title="No items found"
            description={`No items are currently tagged with "${tagName}"`}
            icon="🏷️"
          />
        ) : (
          <VStack align="stretch" gap={4}>
            {items.map((item) => (
              <Box
                key={item.id}
                p={4}
                bg="bg.card"
                borderWidth="1px"
                borderColor="border.card"
                borderRadius="xl"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ borderColor: 'border.focus', transform: 'translateY(-2px)', shadow: 'md' }}
                onClick={() => window.location.href = `/items/${item.id}`}
              >
                <Flex gap={4} align="flex-start">
                  {item.coverImage && (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width="80px"
                      height="120px"
                      objectFit="cover"
                      borderRadius="lg"
                      flexShrink={0}
                    />
                  )}
                  <VStack align="stretch" flex="1" gap={2}>
                    <Box>
                      <Heading size="md" mb={1} fontFamily="heading">{item.title}</Heading>
                      {item.creator && (
                        <Text color="fg.muted" fontSize="sm">
                          by {item.creator}
                        </Text>
                      )}
                    </Box>
                    <Flex gap={3} align="center" wrap="wrap">
                      <Badge colorPalette="accent" textTransform="capitalize">
                        {item.mediaType}
                      </Badge>
                      {item.averageRating !== null && (
                        <Flex gap={2} align="center">
                          <StarRating rating={item.averageRating} size="16px" />
                          <Text fontSize="sm" color="fg.muted">
                            {item.averageRating.toFixed(1)} ({item.totalRatings})
                          </Text>
                        </Flex>
                      )}
                      {sortBy === 'relevant' && item.tagCount !== undefined && (
                        <Text fontSize="sm" color="fg.muted">
                          Tagged {item.tagCount} {item.tagCount === 1 ? 'time' : 'times'}
                        </Text>
                      )}
                    </Flex>
                    {item.description && (
                      <Text
                        fontSize="sm"
                        color="fg.muted"
                        css={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </Text>
                    )}
                  </VStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
