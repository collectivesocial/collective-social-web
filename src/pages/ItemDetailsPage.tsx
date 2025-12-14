import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  Input,
  Textarea,
} from '@chakra-ui/react';
import { LuPlus, LuX, LuPencil, LuCheck, LuExternalLink } from 'react-icons/lu';
import { EmptyState } from '../components/EmptyState';
import { ShareButton } from '../components/ShareButton';
import { StarRating } from '../components/StarRating';
import { RatingDistributionDisplay } from '../components/RatingDistribution';
import { TagInput } from '../components/TagInput';
import { ReportTagModal } from '../components/ReportTagModal';
import { ReviewItem } from '../components/ReviewItem';
import { ItemModal } from '../components/ItemModal';
import type { Collection } from '../components/ItemModal';
import { Field } from '../components/ui/field';

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
  createdBy: string | null;
  ratingDistribution?: RatingDistribution;
  url?: string | null;
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
  hasAdminTag: boolean;
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
  const [showItemModal, setShowItemModal] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedListUri, setSelectedListUri] = useState<string>('');
  const [reviewData, setReviewData] = useState({
    status: 'want',
    rating: 0,
    review: '',
    notes: '',
    recommendedBy: '',
    completedAt: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState<{
    title: string;
    creator: string;
    coverImage: string;
    description: string;
    publishedYear: string;
    length: string;
  }>({
    title: '',
    creator: '',
    coverImage: '',
    description: '',
    publishedYear: '',
    length: '',
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
      
      // Check if we need to highlight a specific review (from share link)
      const highlightReviewId = searchParams.get('reviewId');
      let reviewsList = data.reviews;
      
      if (highlightReviewId && offset === 0) {
        // Find the highlighted review and move it to the top
        const highlightedIndex = reviewsList.findIndex(
          (r: any) => r.id === parseInt(highlightReviewId)
        );
        
        if (highlightedIndex > 0) {
          // Move highlighted review to the top
          const highlightedReview = reviewsList[highlightedIndex];
          reviewsList = [
            highlightedReview,
            ...reviewsList.slice(0, highlightedIndex),
            ...reviewsList.slice(highlightedIndex + 1),
          ];
        }
      }
      
      if (offset === 0) {
        setReviews(reviewsList);
      } else {
        setReviews(prev => [...prev, ...reviewsList]);
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

  const fetchCollections = async () => {
    if (!currentUserDid) return;

    try {
      const response = await fetch(`${apiUrl}/collections/public/${currentUserDid}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
        if (data.collections.length > 0) {
          setSelectedListUri(data.collections[0].uri);
        }
      }
    } catch (err) {
      console.error('Failed to fetch collections:', err);
    }
  };

  const handleAddToCollection = () => {
    if (!currentUserDid) {
      navigate('/');
      return;
    }
    fetchCollections();
    setShowItemModal(true);
  };

  const handleEditClick = () => {
    if (!item) return;
    setEditedItem({
      title: item.title,
      creator: item.creator || '',
      coverImage: item.coverImage || '',
      description: item.description || '',
      publishedYear: item.publishedYear?.toString() || '',
      length: item.length?.toString() || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!item) return;

    try {
      const response = await fetch(`${apiUrl}/media/${item.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedItem.title,
          creator: editedItem.creator || null,
          coverImage: editedItem.coverImage || null,
          description: editedItem.description || null,
          publishedYear: editedItem.publishedYear ? parseInt(editedItem.publishedYear) : null,
          length: editedItem.length ? parseInt(editedItem.length) : null,
        }),
      });

      if (response.ok) {
        // Refresh the item data
        const itemResponse = await fetch(`${apiUrl}/media/${item.id}`);
        if (itemResponse.ok) {
          const data = await itemResponse.json();
          setItem(data);
        }
        setIsEditing(false);
        alert('Successfully updated item!');
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        alert(data.error || 'Failed to update item');
      }
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to update item');
    }
  };

  const handleItemModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!item || !selectedListUri) {
      console.error('Missing required data:', { item, selectedListUri });
      alert('Please select a collection');
      return;
    }

    try {
      const encodedListUri = encodeURIComponent(selectedListUri);
      const response = await fetch(`${apiUrl}/collections/${encodedListUri}/items`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaItemId: item.id,
          title: item.title,
          creator: item.creator,
          mediaType: item.mediaType,
          status: reviewData.status,
          rating: reviewData.rating || null,
          review: reviewData.review || null,
          notes: reviewData.notes || null,
          recommendedBy: reviewData.recommendedBy || null,
          completedAt: reviewData.completedAt || null,
        }),
      });

      if (response.ok) {
        setShowItemModal(false);
        // Reset review data
        setReviewData({
          status: 'want',
          rating: 0,
          review: '',
          notes: '',
          recommendedBy: '',
          completedAt: '',
        });
        // Optionally show success message
        alert('Successfully added to collection!');
      } else {
        const data = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Server error response:', data);
        alert(data.error || 'Failed to add to collection');
      }
    } catch (err) {
      console.error('Failed to add to collection:', err);
      alert('Failed to add to collection: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };  const handleRemoveTag = async (tagId: number) => {
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
                {isEditing ? (
                  <Input
                    value={editedItem.title}
                    onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                    size="lg"
                    fontWeight="bold"
                  />
                ) : (
                  <Heading size={{ base: 'xl', md: '2xl' }}>
                    {item.title}
                  </Heading>
                )}
              </Box>
              <HStack gap={2}>
                {currentUserDid && item.createdBy === currentUserDid && (
                  <>
                    {isEditing ? (
                      <>
                        <Button
                          onClick={handleSaveEdit}
                          colorPalette="teal"
                          size="md"
                          title="Save Changes"
                        >
                          <LuCheck />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="outline"
                          bg="transparent"
                          size="md"
                          title="Cancel"
                        >
                          <LuX />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditClick}
                        colorPalette="teal"
                        variant="outline"
                        bg="transparent"
                        size="md"
                        title="Edit Item"
                      >
                        <LuPencil />
                      </Button>
                    )}
                  </>
                )}
                {currentUserDid && !isEditing && (
                  <Button
                    onClick={handleAddToCollection}
                    colorPalette="teal"
                    size="md"
                    variant="outline"
                    title="Add to Collection"
                    bg="transparent"
                  >
                    <LuPlus />
                  </Button>
                )}
                {!isEditing && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex' }}
                  >
                    <IconButton
                      size="xs"
                      bg="transparent"
                      variant="outline"
                      aria-label="Open link"
                      title="Open in new tab"
                    >
                      <LuExternalLink />
                    </IconButton>
                  </a>
                )}
                {!isEditing && (
                  <ShareButton
                    apiUrl={apiUrl}
                    mediaItemId={item.id}
                    mediaType={item.mediaType}
                    size="md"
                    variant="outline"
                  />
                )}
              </HStack>
            </Flex>
            
            {isEditing ? (
              <Input
                value={editedItem.creator}
                onChange={(e) => setEditedItem({ ...editedItem, creator: e.target.value })}
                placeholder="Creator (author, director, artist, etc.)"
              />
            ) : item.creator ? (
              <Text color="fg.muted" fontSize={{ base: 'lg', md: 'xl' }}>
                by {item.creator}
              </Text>
            ) : null}

            {isEditing ? (
              <VStack align="stretch" gap={3} w="full">
                <HStack gap={3}>
                  <Box flex={1}>
                    <Field label="Year">
                      <Input
                        type="number"
                        value={editedItem.publishedYear}
                        onChange={(e) => setEditedItem({ ...editedItem, publishedYear: e.target.value })}
                        placeholder="2025"
                      />
                    </Field>
                  </Box>
                  <Box flex={1}>
                    <Field label={item.mediaType === 'book' ? 'Pages' : 'Length'}>
                      <Input
                        type="number"
                        value={editedItem.length}
                        onChange={(e) => setEditedItem({ ...editedItem, length: e.target.value })}
                        placeholder="0"
                      />
                    </Field>
                  </Box>
                </HStack>
                <Field label="Cover Image URL">
                  <Input
                    value={editedItem.coverImage}
                    onChange={(e) => setEditedItem({ ...editedItem, coverImage: e.target.value })}
                    placeholder="https://..."
                  />
                </Field>
              </VStack>
            ) : (
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
            )}

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

        {(item.description || isEditing) && (
          <Box mt={8}>
            <Heading size="lg" mb={4}>
              Description
            </Heading>
            {isEditing ? (
              <Textarea
                value={editedItem.description}
                onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                placeholder="Enter description..."
                rows={6}
                resize="vertical"
              />
            ) : (
              <Text
                lineHeight="1.6"
                fontSize="sm"
                whiteSpace="pre-wrap"
              >
                {item.description}
              </Text>
            )}
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
                  cursor="pointer"
                  _hover={{ bg: 'teal.100' }}
                  onClick={() => navigate(`/tags/${tag.slug}`)}
                >
                  {tag.name}
                  <Text as="span" color="fg.muted" fontSize="xs">
                    ({tag.usageCount})
                  </Text>
                  {currentUserDid && !isAdmin && tag.usageCount < 5 && !tag.hasAdminTag && (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <ReportTagModal
                        apiUrl={apiUrl}
                        itemId={parseInt(itemId!)}
                        tagId={tag.id}
                        tagName={tag.name}
                        onReported={() => {
                          // Optionally refresh tags or show confirmation
                        }}
                      />
                    </Box>
                  )}
                  {isAdmin && (
                    <IconButton
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag.id);
                      }}
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
                <ReviewItem
                  key={review.id}
                  review={review}
                  apiUrl={apiUrl}
                  currentUserDid={currentUserDid}
                  formatDate={formatDate}
                />
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

      {/* Add to Collection Modal */}
      <ItemModal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onSubmit={handleItemModalSubmit}
        apiUrl={apiUrl}
        mode="add"
        selectedMedia={item ? {
          title: item.title,
          author: item.creator,
          publishYear: item.publishedYear,
          isbn: item.isbn,
          coverImage: item.coverImage,
          mediaType: item.mediaType,
          inDatabase: true,
          totalRatings: item.totalRatings,
          totalReviews: item.totalReviews,
          averageRating: item.averageRating,
          mediaItemId: item.id,
        } : null}
        onMediaSelect={() => {}}
        reviewData={reviewData}
        onReviewDataChange={setReviewData}
        collections={collections}
        currentListUri={selectedListUri}
        onListChange={setSelectedListUri}
        onCollectionsRefresh={fetchCollections}
        mediaItemId={item?.id}
        mediaItemLength={item?.length}
      />
    </Container>
  );
}
