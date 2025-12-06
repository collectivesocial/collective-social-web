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
  IconButton,
} from '@chakra-ui/react';
import { LuPencil, LuArrowDownUp } from 'react-icons/lu';
import { MediaItemCard, type ListItem } from '../components/MediaItemCard';
import { ItemModal, type Collection } from '../components/ItemModal';
import { EmptyState } from '../components/EmptyState';
import { EditCollectionModal } from '../components/EditCollectionModal';

interface MediaSearchResult {
  title: string;
  author: string | null;
  publishYear: number | null;
  isbn: string | null;
  coverImage: string | null;
  mediaType?: string;
  inDatabase: boolean;
  totalRatings: number;
  totalReviews: number;
  averageRating: number | null;
  mediaItemId: number | null;
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
  const [allCollections, setAllCollections] = useState<Collection[]>([]);
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
    status: '',
    rating: 0,
    review: '',
    notes: '',
    completedAt: '',
  });
  const [newListUri, setNewListUri] = useState<string | null>(null);
  const [showEditCollectionModal, setShowEditCollectionModal] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
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

  const refetchItems = async () => {
    try {
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
      console.error('Failed to refetch items:', err);
    }
  };

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
        setAllCollections(collectionsData.collections);
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

  const handleEditCollection = () => {
    setShowEditCollectionModal(true);
  };

  const handleToggleReorderMode = () => {
    setIsReorderMode(!isReorderMode);
  };

  const handleMoveUp = (item: ListItem) => {
    const currentIndex = items.findIndex((i) => i.uri === item.uri);
    if (currentIndex > 0) {
      const newItems = [...items];
      [newItems[currentIndex - 1], newItems[currentIndex]] = [
        newItems[currentIndex],
        newItems[currentIndex - 1],
      ];
      setItems(newItems);
    }
  };

  const handleMoveDown = (item: ListItem) => {
    const currentIndex = items.findIndex((i) => i.uri === item.uri);
    if (currentIndex < items.length - 1) {
      const newItems = [...items];
      [newItems[currentIndex], newItems[currentIndex + 1]] = [
        newItems[currentIndex + 1],
        newItems[currentIndex],
      ];
      setItems(newItems);
    }
  };

  const handleSaveOrder = async () => {
    try {
      // Assign order numbers: highest index = highest order (top of list)
      const updates = items.map((item, index) => ({
        uri: item.uri,
        order: items.length - index, // Reverse so first item has highest order
      }));

      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/reorder`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ items: updates }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      setIsReorderMode(false);
    } catch (err) {
      console.error('Failed to save order:', err);
      alert('Failed to save order');
    }
  };

  const handleCancelReorder = async () => {
    // Reload items to reset to original order
    try {
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
      console.error('Failed to reload items:', err);
    }
    setIsReorderMode(false);
  };

  const handleSaveCollection = async (name: string, description: string | null) => {
    const response = await fetch(
      `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update collection');
    }

    // Update local state
    if (collection) {
      setCollection({
        ...collection,
        name,
        description,
      });
    }
  };

  const handleMediaSelect = (media: MediaSearchResult) => {
    setSelectedMedia(media);
  };

  const refreshCollections = async () => {
    try {
      const collectionsRes = await fetch(`${apiUrl}/collections`, {
        credentials: 'include',
      });
      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json();
        setAllCollections(collectionsData.collections);
      }
    } catch (err) {
      console.error('Failed to refresh collections:', err);
    }
  };

  const handleEditItem = (item: ListItem) => {
    setEditingItem(item);
    setEditData({
      status: item.status || 'want',
      rating: item.rating || 0,
      review: item.review || '',
      notes: item.notes || '',
      completedAt: item.completedAt || '',
    });
    setNewListUri(null);
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
      // If list is changing, we need to delete from old list and add to new list
      if (newListUri && newListUri !== collectionUri) {
        // First, add to new list
        const addResponse = await fetch(
          `${apiUrl}/collections/${encodeURIComponent(newListUri)}/items`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: editingItem.title,
              creator: editingItem.creator,
              mediaType: editingItem.mediaType || 'book',
              mediaItemId: editingItem.mediaItemId,
              status: editData.status,
              rating: editData.rating,
              review: editData.review,
              notes: editData.notes,
            }),
          }
        );

        if (!addResponse.ok) {
          throw new Error('Failed to add item to new list');
        }

        // Then delete from old list
        const deleteResponse = await fetch(
          `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items/${encodeURIComponent(editingItem.uri)}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        );

        if (!deleteResponse.ok) {
          throw new Error('Failed to remove item from old list');
        }
      } else {
        // Just update in current list
        const response = await fetch(
          `${apiUrl}/collections/${encodeURIComponent(collectionUri!)}/items/${encodeURIComponent(editingItem.uri)}`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: editData.status,
              rating: editData.rating,
              review: editData.review,
              notes: editData.notes,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update item');
        }
      }

      setShowEditItemModal(false);
      setEditingItem(null);
      setEditData({
        status: '',
        rating: 0,
        review: '',
        notes: '',
        completedAt: '',
      });
      setNewListUri(null);

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
            mediaType: selectedMedia.mediaType || 'book',
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
        {isOwner() && (
          <HStack gap={2} flexShrink={0} alignSelf={{ base: 'stretch', md: 'flex-start' }}>
            {!isReorderMode ? (
              <>
                <IconButton
                  onClick={handleEditCollection}
                  colorPalette="teal"
                  variant="ghost"
                  bg="transparent"
                  aria-label="Edit collection"
                >
                  <LuPencil />
                </IconButton>
                <IconButton
                  onClick={handleToggleReorderMode}
                  variant="ghost"
                  bg="transparent"
                  aria-label="Reorder items"
                >
                  <LuArrowDownUp />
                </IconButton>
                <Button
                  colorPalette="teal"
                  bg="teal"
                  onClick={() => setShowAddItemModal(true)}
                >
                  + Add Item
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleSaveOrder}
                  colorPalette="teal"
                  variant="solid"
                  bg="teal"
                >
                  Save Order
                </Button>
                <Button
                  onClick={handleCancelReorder}
                  variant="outline"
                  bg="transparent"
                >
                  Cancel
                </Button>
              </>
            )}
          </HStack>
        )}
      </Flex>

{items.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No items yet"
          description="Add your first item to start tracking and reviewing."
        />
      ) : (
        <VStack gap={8} align="stretch">
          {/* In Progress Section */}
          {items.filter((item) => item.status === 'in-progress').length > 0 && (
            <Box>
              <Heading size="lg" mb={4} color="teal.600">
                In Progress
              </Heading>
              <VStack gap={4} align="stretch">
                {items
                  .filter((item) => item.status === 'in-progress')
                  .map((item, index, filteredItems) => (
                    <MediaItemCard
                      key={item.uri}
                      item={item}
                      recommenderHandles={recommenderHandles}
                      isOwner={isOwner()}
                      isReorderMode={isReorderMode}
                      canMoveUp={index > 0}
                      canMoveDown={index < filteredItems.length - 1}
                      apiUrl={apiUrl}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                    />
                  ))}
              </VStack>
            </Box>
          )}

          {/* Want Section */}
          {items.filter((item) => item.status === 'want').length > 0 && (
            <Box>
              <Heading size="lg" mb={4} color="fg.muted">
                To do
              </Heading>
              <VStack gap={4} align="stretch">
                {items
                  .filter((item) => item.status === 'want')
                  .map((item, index, filteredItems) => (
                    <MediaItemCard
                      key={item.uri}
                      item={item}
                      recommenderHandles={recommenderHandles}
                      isOwner={isOwner()}
                      isReorderMode={isReorderMode}
                      canMoveUp={index > 0}
                      canMoveDown={index < filteredItems.length - 1}
                      apiUrl={apiUrl}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                    />
                  ))}
              </VStack>
            </Box>
          )}

          {/* Completed Section */}
          {items.filter((item) => item.status === 'completed').length > 0 && (
            <Box>
              <Heading size="lg" mb={4} color="fg.muted">
                Completed
              </Heading>
              <VStack gap={4} align="stretch">
                {items
                  .filter((item) => item.status === 'completed')
                  .map((item, index, filteredItems) => (
                    <Box key={item.uri} opacity={0.6}>
                      <MediaItemCard
                        item={item}
                        recommenderHandles={recommenderHandles}
                        isOwner={isOwner()}
                        isReorderMode={isReorderMode}
                        canMoveUp={index > 0}
                        canMoveDown={index < filteredItems.length - 1}
                        apiUrl={apiUrl}
                        onEdit={handleEditItem}
                        onDelete={handleDeleteItem}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                      />
                    </Box>
                  ))}
              </VStack>
            </Box>
          )}
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
            status: '',
            rating: 0,
            review: '',
            notes: '',
            completedAt: '',
          });
          setNewListUri(null);
        }}
        onSubmit={handleUpdateItem}
        apiUrl={apiUrl}
        mode="edit"
        selectedMedia={null}
        onMediaSelect={() => {}}
        reviewData={{
          status: editData.status,
          rating: editData.rating,
          review: editData.review,
          notes: editData.notes,
          recommendedBy: '',
          completedAt: editData.completedAt,
        }}
        onReviewDataChange={(data) =>
          setEditData({
            status: data.status,
            rating: data.rating,
            review: data.review,
            notes: data.notes,
            completedAt: data.completedAt,
          })
        }
        itemTitle={editingItem?.title}
        itemCreator={editingItem?.creator || undefined}
        itemCoverImage={editingItem?.mediaItem?.coverImage || undefined}
        collections={allCollections}
        currentListUri={collectionUri}
        onListChange={(listUri) => setNewListUri(listUri)}
        onCollectionsRefresh={refreshCollections}
        listItemUri={editingItem?.uri}
        mediaItemId={editingItem?.mediaItemId}
        mediaItemLength={editingItem?.mediaItem?.length}
        onSegmentChange={refetchItems}
      />

      {/* Edit Collection Modal */}
      <EditCollectionModal
        isOpen={showEditCollectionModal}
        onClose={() => setShowEditCollectionModal(false)}
        collectionName={collection?.name || ''}
        collectionDescription={collection?.description || null}
        onSave={handleSaveCollection}
      />
    </Container>
  );
}
