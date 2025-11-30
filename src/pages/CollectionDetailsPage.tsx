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
  Spinner,
  Center,
} from '@chakra-ui/react';
import { MediaItemCard } from '../components/MediaItemCard';
import { ItemModal } from '../components/ItemModal';
import { EmptyState } from '../components/EmptyState';

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
  notes: string | null;
  recommendations: Recommendation[];
  createdAt: string;
  mediaItem?: {
    id: number;
    isbn: string | null;
    externalId: string | null;
    coverImage: string | null;
    description: string | null;
    publishedYear: number | null;
    totalRatings: number;
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
    notes: '',
    recommendedBy: '',
    completedAt: '',
  });
  const [editData, setEditData] = useState({
    rating: 0,
    review: '',
    notes: '',
  });
  const navigate = useNavigate();

  // Handle shared link parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const shouldAdd = searchParams.get('add');
    const mediaId = searchParams.get('mediaId');
    const sharedTitle = searchParams.get('title');
    const sharedCreator = searchParams.get('creator');
    const sharedIsbn = searchParams.get('isbn');
    const sharedRecommender = searchParams.get('recommendedBy');
    const sharedCoverImage = searchParams.get('coverImage');

    // Support both old 'mediaItemId' and new 'mediaId' parameters
    const sharedMediaItemId = mediaId || searchParams.get('mediaItemId');

    if (shouldAdd === 'true' && sharedTitle && currentUserDid) {
      // Pre-populate the form with shared data
      setSelectedMedia({
        title: sharedTitle,
        author: sharedCreator,
        publishYear: null,
        isbn: sharedIsbn,
        coverImage: sharedCoverImage,
        inDatabase: !!sharedMediaItemId,
        totalRatings: 0,
        totalReviews: 0,
        averageRating: null,
        mediaItemId: sharedMediaItemId ? parseInt(sharedMediaItemId) : null,
      });
      setReviewData({
        status: 'want',
        rating: 0,
        review: '',
        notes: '',
        recommendedBy: sharedRecommender || '',
        completedAt: '',
      });
      setShowAddItemModal(true);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentUserDid]);

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

  const isOwner = (): boolean => {
    if (!currentUserDid || !collectionUri) return false;
    const decodedUri = decodeURIComponent(collectionUri);
    const didMatch = decodedUri.match(/^at:\/\/([^\/]+)/);
    return !!(didMatch && didMatch[1] === currentUserDid);
  };

  const handleMediaSelect = (media: MediaSearchResult) => {
    setSelectedMedia(media);
  };

  const handleEditItem = (item: ListItem) => {
    setEditingItem(item);
    setEditData({
      rating: item.rating || 0,
      review: item.review || '',
      notes: item.notes || '',
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
            notes: editData.notes,
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
        notes: '',
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
            notes: reviewData.notes,
            recommendedBy: reviewData.recommendedBy || undefined,
            completedAt: reviewData.completedAt ? new Date(reviewData.completedAt).toISOString() : undefined,
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
        notes: '',
        recommendedBy: '',
        completedAt: '',
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
      <Center py={8}>
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text color="fg.muted">Loading collection...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={8}>
        <Text color="red.500">Error: {error}</Text>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        gap={4}
        mb={8}
      >
        <Box flex={1}>
          <Button
            variant="ghost"
            colorPalette="teal"
            bg="transparent"
            onClick={() => navigate('/collections')}
            mb={2}
            size="sm"
            px={0}
          >
            ← Back to Collections
          </Button>
          <Heading size="2xl" mb={2}>
            {collection?.name || 'Collection'}
          </Heading>
          {collection?.description && (
            <Text color="fg.muted" mt={2}>
              {collection.description}
            </Text>
          )}
        </Box>
        <Button
          colorPalette="teal"
          bg="teal"
          onClick={() => setShowAddItemModal(true)}
          flexShrink={0}
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
        >
          + Add Item
        </Button>
      </Flex>

      {items.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No items yet"
          description="Add your first item to start tracking and reviewing."
        />
      ) : (
        <VStack gap={4} align="stretch">
          {items.map((item) => (
            <MediaItemCard
              key={item.uri}
              item={item}
              recommenderHandles={recommenderHandles}
              isOwner={isOwner()}
              apiUrl={apiUrl}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          ))}
        </VStack>
      )}

      {/* Add Item Modal */}
      <ItemModal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          setSelectedMedia(null);
          setReviewData({
            status: 'want',
            rating: 0,
            review: '',
            notes: '',
            recommendedBy: '',
            completedAt: '',
          });
        }}
        onSubmit={handleAddItem}
        apiUrl={apiUrl}
        mode="add"
        selectedMedia={selectedMedia}
        onMediaSelect={handleMediaSelect}
        reviewData={reviewData}
        onReviewDataChange={setReviewData}
      />

      {/* Edit Item Modal */}
      <ItemModal
        isOpen={showEditItemModal}
        onClose={() => {
          setShowEditItemModal(false);
          setEditingItem(null);
          setEditData({
            rating: 0,
            review: '',
            notes: '',
          });
        }}
        onSubmit={handleUpdateItem}
        apiUrl={apiUrl}
        mode="edit"
        selectedMedia={null}
        onMediaSelect={() => {}}
        reviewData={{
          status: '',
          rating: editData.rating,
          review: editData.review,
          notes: editData.notes,
          recommendedBy: '',
          completedAt: '',
        }}
        onReviewDataChange={(data) =>
          setEditData({
            rating: data.rating,
            review: data.review,
            notes: data.notes,
          })
        }
        itemTitle={editingItem?.title}
        itemCreator={editingItem?.creator || undefined}
        itemCoverImage={editingItem?.mediaItem?.coverImage || undefined}
      />
    </Container>
  );
}
