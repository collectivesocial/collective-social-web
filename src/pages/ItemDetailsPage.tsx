import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  IconButton,
} from '@chakra-ui/react';
import { LuPlus, LuX } from 'react-icons/lu';
import { Avatar } from '../components/ui/avatar';
import { EmptyState } from '../components/EmptyState';
import { ShareButton } from '../components/ShareButton';
import { StarRating } from '../components/StarRating';
import { RatingDistributionDisplay } from '../components/RatingDistribution';
import { TagInput } from '../components/TagInput';
import { ReportTagModal } from '../components/ReportTagModal';

interface RatingDistribution {
  rating0: number;
  rating0_5: number;
  rating1: number;
  rating1_5: number;
  rating2: number;
  rating2_5: number;
  rating3: number;
  rating3_5: number;
  rating4: number;
  rating4_5: number;
  rating5: number;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  length: number | null;
  totalRatings: number;
  totalReviews: number;
  totalSaves: number;
  averageRating: number | null;
  ratingDistribution?: RatingDistribution;
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

interface Tag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
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
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [currentUserDid, setCurrentUserDid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const REVIEWS_PER_PAGE = 10;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUserDid(data.did);
          setIsAdmin(data.isAdmin || false);
        }
      } catch (err) {
        // User not logged in
      }
    };

    fetchCurrentUser();
  }, [apiUrl]);

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

        // Fetch tags
        fetchTags();
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

  const fetchTags = async () => {
    if (!itemId) return;

    setTagsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/media/${itemId}/tags`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTags(data.tags || []);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    } finally {
      setTagsLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!itemId) return;

    try {
      const response = await fetch(`${apiUrl}/media/${itemId}/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchTags();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove tag');
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
      alert('Failed to remove tag');
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
      <Center py={8}>
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text color="fg.muted">Loading item details...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !item) {
    return (
      <Center py={8}>
        <VStack gap={4}>
          <Text color="red.500">Error: {error || 'Item not found'}</Text>
          <Button
            colorPalette="teal"
            bg="transparent"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        p={{ base: 4, md: 8 }}
      >
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap={{ base: 4, md: 8 }}
          mb={8}
          align={{ base: 'center', md: 'flex-start' }}
        >
          {item.coverImage && (
            <img
              src={item.coverImage}
              alt={item.title}
              style={{
                width: '200px',
                height: '300px',
                objectFit: 'cover',
                borderRadius: '0.5rem',
                flexShrink: 0,
              }}
            />
          )}
          
          <VStack align={{ base: 'center', md: 'flex-start' }} flex={1} gap={4} textAlign={{ base: 'center', md: 'left' }}>
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              w="full" 
              align={{ base: 'center', md: 'flex-start' }} 
              justify="space-between" 
              gap={4}
            >
              <Box flex={1}>
                <Heading size={{ base: 'xl', md: '2xl' }}>
                  {item.title}
                </Heading>
              </Box>
              <ShareButton
                apiUrl={apiUrl}
                mediaItemId={item.id}
                mediaType={item.mediaType}
                size="md"
                variant="outline"
              />
            </Flex>
            
            {item.creator && (
              <Text color="fg.muted" fontSize={{ base: 'lg', md: 'xl' }}>
                by {item.creator}
              </Text>
            )}

            <VStack align={{ base: 'center', md: 'flex-start' }} gap={2}>
              {item.publishedYear && (
                <Text color="fg.muted" fontSize="sm">
                  Published: {item.publishedYear}
                </Text>
              )}

              {item.mediaType === 'book' && item.length && (
                <Text color="fg.muted" fontSize="sm">
                  {item.length} pages
                </Text>
              )}

              {item.isbn && (
                <Text color="fg.muted" fontSize="sm">
                  ISBN: {item.isbn}
                </Text>
              )}
            </VStack>

            {item.totalReviews > 0 && (
              <VStack align={{ base: 'stretch', md: 'flex-start' }} gap={3} w={{ base: 'full', md: 'auto' }}>
                <Box
                  p={4}
                  bg="bg.muted"
                  borderRadius="md"
                  w="full"
                >
                  <HStack gap={4}>
                    <StarRating rating={item.averageRating || 0} size="2rem" />
                    <VStack align="flex-start" gap={0}>
                      <Text fontSize="2xl" fontWeight="bold">
                        {item.averageRating?.toFixed(1)}
                      </Text>
                      <Text color="fg.muted" fontSize="sm">
                        {item.totalRatings} {item.totalRatings === 1 ? 'rating' : 'ratings'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                {item.ratingDistribution && (
                  <RatingDistributionDisplay
                    distribution={item.ratingDistribution}
                    totalRatings={item.totalRatings}
                  />
                )}
              </VStack>
            )}
          </VStack>
        </Flex>

        {item.description && (
          <Box mt={8}>
            <Heading size="lg" mb={4}>
              Description
            </Heading>
            <Text
              lineHeight="1.6"
              fontSize="sm"
              whiteSpace="pre-wrap"
            >
              {item.description}
            </Text>
          </Box>
        )}

        {/* Tags Section */}
        <Box mt={8} pt={8} borderTopWidth="1px" borderTopColor="border">
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md">Tags</Heading>
            {currentUserDid && !showTagInput && (
              <Button
                size="sm"
                colorPalette="teal"
                variant="outline"
                bg="transparent"
                onClick={() => setShowTagInput(true)}
              >
                <LuPlus /> Add Tag
              </Button>
            )}
          </Flex>

          {showTagInput && itemId && (
            <Box mb={4}>
              <TagInput
                apiUrl={apiUrl}
                itemId={parseInt(itemId)}
                onTagAdded={() => {
                  setShowTagInput(false);
                  fetchTags();
                }}
                onCancel={() => setShowTagInput(false)}
              />
            </Box>
          )}

          {tagsLoading ? (
            <Center py={4}>
              <Spinner size="sm" color="teal.500" />
            </Center>
          ) : tags.length > 0 ? (
            <Flex gap={2} flexWrap="wrap">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  colorPalette="teal"
                  variant="subtle"
                  fontSize="sm"
                  px={3}
                  py={1}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  {tag.name}
                  <Text as="span" color="fg.muted" fontSize="xs">
                    ({tag.usageCount})
                  </Text>
                  {currentUserDid && !isAdmin && (
                    <ReportTagModal
                      apiUrl={apiUrl}
                      itemId={parseInt(itemId!)}
                      tagId={tag.id}
                      tagName={tag.name}
                      onReported={() => {
                        // Optionally refresh tags or show confirmation
                      }}
                    />
                  )}
                  {isAdmin && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() => handleRemoveTag(tag.id)}
                      aria-label="Remove tag"
                      bg="transparent"
                      h="16px"
                      minW="16px"
                      p={0}
                    >
                      <LuX size={12} />
                    </IconButton>
                  )}
                </Badge>
              ))}
            </Flex>
          ) : (
            <Text color="fg.muted" fontSize="sm">
              No tags yet. {currentUserDid && 'Be the first to add one!'}
            </Text>
          )}
        </Box>

        {item.totalReviews === 0 && (
          <Box mt={8}>
            <EmptyState
              icon="📝"
              title="No reviews yet"
              description={`Be the first to review this ${item.mediaType}!`}
            />
          </Box>
        )}

        {reviews.length > 0 && (
          <Box mt={8}>
            <Heading size="xl" mb={6}>
              Reviews ({item.totalReviews})
            </Heading>
            
            <VStack gap={4} align="stretch">
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  bg="bg.muted"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="lg"
                  p={{ base: 4, md: 6 }}
                >
                  <Flex gap={4} mb={4} direction={{ base: 'column', sm: 'row' }}>
                    <Avatar
                      size="lg"
                      name={review.authorDisplayName}
                      src={review.authorAvatar || undefined}
                      fallback="👤"
                      bg="transparent"
                      flexShrink={0}
                    />
                    
                    <Box flex={1} minW={0}>
                      <Flex
                        direction={{ base: 'column', sm: 'row' }}
                        justify="space-between"
                        gap={2}
                      >
                        <Flex
                          align="center"
                          gap={2}
                          flexWrap="wrap"
                          cursor="pointer"
                          onClick={() => navigate(`/profile/${review.authorHandle}`)}
                        >
                          <Text
                            fontWeight="bold"
                            _hover={{ color: 'teal.500' }}
                          >
                            {review.authorDisplayName}
                          </Text>
                          <Text
                            color="fg.muted"
                            fontSize="sm"
                            _hover={{ color: 'teal.500' }}
                          >
                            @{review.authorHandle}
                          </Text>
                          <Text color="fg.muted" fontSize="sm">·</Text>
                          <Text color="fg.muted" fontSize="sm">
                            {formatDate(review.createdAt)}
                          </Text>
                        </Flex>
                        <HStack gap={1} flexShrink={0}>
                          <StarRating rating={review.rating} size="1.25rem" />
                          <Text color="fg.muted" fontSize="sm">
                            {review.rating.toFixed(1)}
                          </Text>
                        </HStack>
                      </Flex>
                    </Box>
                  </Flex>
                  
                  <Text
                    lineHeight="1.6"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {review.review}
                  </Text>
                </Box>
              ))}
            </VStack>

            {hasMoreReviews && (
              <Center mt={6}>
                <Button
                  colorPalette="teal"
                  onClick={loadMoreReviews}
                  disabled={reviewsLoading}
                  bg="transparent"
                  size="lg"
                >
                  {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                </Button>
              </Center>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
