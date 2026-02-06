import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Table,
  Input,
  IconButton,
  Textarea,
  Link,
} from '@chakra-ui/react';
import { LuPencil, LuTrash2, LuX } from 'react-icons/lu';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogBackdrop, DialogPositioner } from './ui/dialog';
import { Field } from './ui/field';
import { StarRating } from './StarRating';

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
  createdAt: string;
}

interface MediaManagementProps {
  apiUrl: string;
}

export function MediaManagement({ apiUrl }: MediaManagementProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [totalMediaItems, setTotalMediaItems] = useState(0);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [loadingMediaDetails, setLoadingMediaDetails] = useState(false);
  const [editMediaTitle, setEditMediaTitle] = useState('');
  const [editMediaCreator, setEditMediaCreator] = useState('');
  const [editMediaCoverImage, setEditMediaCoverImage] = useState('');
  const [editMediaDescription, setEditMediaDescription] = useState('');
  const [editMediaPublishedYear, setEditMediaPublishedYear] = useState('');
  const [editMediaLength, setEditMediaLength] = useState('');
  const [savingMedia, setSavingMedia] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [filteredMediaItems, setFilteredMediaItems] = useState<MediaItem[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaPerPage] = useState(20);
  const [mediaTags, setMediaTags] = useState<Array<{ id: number; name: string; slug: string; usageCount: number }>>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Fetch media items with pagination
  useEffect(() => {
    const fetchMediaItems = async () => {
      try {
        const mediaRes = await fetch(
          `${apiUrl}/admin/media?page=${mediaPage}&limit=${mediaPerPage}`,
          {
            credentials: 'include',
          }
        );

        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          setMediaItems(mediaData.mediaItems);
          setTotalMediaItems(mediaData.totalMediaItems);
        }
      } catch (err) {
        console.error('Failed to fetch media items:', err);
      }
    };

    fetchMediaItems();
  }, [apiUrl, mediaPage, mediaPerPage]);

  // Filter media items based on search query with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!mediaSearchQuery.trim()) {
        setFilteredMediaItems(mediaItems);
      } else {
        // Reset to page 1 when searching
        setMediaPage(1);
        const query = mediaSearchQuery.toLowerCase();
        setFilteredMediaItems(
          mediaItems.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              (item.creator && item.creator.toLowerCase().includes(query)) ||
              (item.isbn && item.isbn.toLowerCase().includes(query))
          )
        );
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [mediaSearchQuery, mediaItems]);

  const handleEditMedia = async (item: MediaItem) => {
    setEditingMedia(item);
    setMediaModalOpen(true);
    setLoadingMediaDetails(true);
    setLoadingTags(true);
    
    // Fetch full media item details from the database
    try {
      const response = await fetch(`${apiUrl}/media/${item.id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Populate form with full data from database
        setEditMediaTitle(data.title || '');
        setEditMediaCreator(data.creator || '');
        setEditMediaCoverImage(data.coverImage || '');
        setEditMediaDescription(data.description || '');
        setEditMediaPublishedYear(data.publishedYear?.toString() || '');
        setEditMediaLength(data.length?.toString() || '');
      } else {
        // Fallback to item data if fetch fails
        setEditMediaTitle(item.title);
        setEditMediaCreator(item.creator || '');
        setEditMediaCoverImage(item.coverImage || '');
        setEditMediaDescription(item.description || '');
        setEditMediaPublishedYear(item.publishedYear?.toString() || '');
        setEditMediaLength(item.length?.toString() || '');
      }
    } catch (err) {
      console.error('Failed to fetch full media item details:', err);
      // Fallback to item data if fetch fails
      setEditMediaTitle(item.title);
      setEditMediaCreator(item.creator || '');
      setEditMediaCoverImage(item.coverImage || '');
      setEditMediaDescription(item.description || '');
      setEditMediaPublishedYear(item.publishedYear?.toString() || '');
      setEditMediaLength(item.length?.toString() || '');
    } finally {
      setLoadingMediaDetails(false);
    }

    // Fetch tags for this media item
    try {
      const tagsResponse = await fetch(`${apiUrl}/media/${item.id}/tags`, {
        credentials: 'include',
      });
      
      if (tagsResponse.ok) {
        const tagsData = await tagsResponse.json();
        setMediaTags(tagsData.tags || []);
      } else {
        setMediaTags([]);
      }
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setMediaTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    if (!editingMedia) return;

    if (!confirm('Remove this tag from the item?')) return;

    try {
      const response = await fetch(`${apiUrl}/media/${editingMedia.id}/tags/${tagId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh tags
        setMediaTags(mediaTags.filter(tag => tag.id !== tagId));
      } else {
        const error = await response.json();
        alert(`Failed to remove tag: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
      alert('Failed to remove tag');
    }
  };

  const handleCloseMediaModal = () => {
    setMediaModalOpen(false);
    setEditingMedia(null);
    setEditMediaTitle('');
    setEditMediaCreator('');
    setEditMediaCoverImage('');
    setEditMediaDescription('');
    setEditMediaPublishedYear('');
    setEditMediaLength('');
  };

  const handleSaveMedia = async () => {
    if (!editingMedia) return;

    setSavingMedia(true);
    try {
      const response = await fetch(`${apiUrl}/media/${editingMedia.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editMediaTitle,
          creator: editMediaCreator || null,
          coverImage: editMediaCoverImage || null,
          description: editMediaDescription || null,
          publishedYear: editMediaPublishedYear ? parseInt(editMediaPublishedYear) : null,
          length: editMediaLength ? parseInt(editMediaLength) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update media item');
      }

      // Update local state
      setMediaItems(mediaItems.map(item =>
        item.id === editingMedia.id
          ? {
              ...item,
              title: editMediaTitle,
              creator: editMediaCreator || null,
              coverImage: editMediaCoverImage || null,
              description: editMediaDescription || null,
              publishedYear: editMediaPublishedYear ? parseInt(editMediaPublishedYear) : null,
              length: editMediaLength ? parseInt(editMediaLength) : null,
            }
          : item
      ));

      handleCloseMediaModal();
    } catch (err) {
      console.error('Failed to update media item:', err);
      alert('Failed to update media item');
    } finally {
      setSavingMedia(false);
    }
  };

  const handleDeleteMedia = async (itemId: number, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${itemTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/media/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media item');
      }

      // Update local state
      setMediaItems(mediaItems.filter(item => item.id !== itemId));
      setTotalMediaItems(totalMediaItems - 1);

      alert('Media item deleted successfully');
    } catch (err) {
      console.error('Failed to delete media item:', err);
      alert('Failed to delete media item');
    }
  };

  return (
    <>
      <Box as="section" mb={{ base: 8, md: 12 }}>
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }}>Media Items</Heading>
          <Badge
            colorPalette="gray"
            size="lg"
            px={4}
            py={2}
          >
            Total: {totalMediaItems}
          </Badge>
        </Flex>

        <Box mb={4}>
          <Input
            placeholder="Search by title, creator, or ISBN..."
            value={mediaSearchQuery}
            onChange={(e) => setMediaSearchQuery(e.target.value)}
            size="md"
          />
        </Box>

        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.muted">
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  ID
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Title
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', lg: 'table-cell' }}>
                  Creator
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', md: 'table-cell' }}>
                  Type
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', xl: 'table-cell' }}>
                  Length
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Reviews
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Rated
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Saved
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
                  Avg Rating
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', lg: 'table-cell' }}>
                  Created
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredMediaItems.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell fontSize="sm" color="fg.muted">
                    {item.id}
                  </Table.Cell>
                  <Table.Cell fontSize="sm">
                    <Link href={`/items/${item.id}`} color="accent.500" _hover={{ textDecoration: 'underline' }}>
                      {item.title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                    {item.creator || '-'}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', md: 'table-cell' }}>
                    <Badge
                      colorPalette="gray"
                      size="sm"
                      textTransform="capitalize"
                    >
                      {item.mediaType}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', xl: 'table-cell' }}>
                    {item.length ? (
                      item.mediaType === 'book' ? `${item.length} pages` :
                      item.mediaType === 'movie' ? `${item.length} min` :
                      item.mediaType === 'tv' ? `${item.length} eps` :
                      item.mediaType === 'course' ? `${item.length} modules` :
                      item.length
                    ) : '-'}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalReviews}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalRatings}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalSaves}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm">
                    {item.averageRating ? (
                      <HStack justify="center" gap={1}>
                        <StarRating rating={item.averageRating} size="1em" />
                        <Text>{item.averageRating.toFixed(1)}</Text>
                      </HStack>
                    ) : (
                      <Text color="fg.muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <HStack gap={1} justify="center">
                      <IconButton
                        aria-label="Edit media item"
                        size="sm"
                        variant="ghost"
                        bg="transparent"
                        onClick={() => handleEditMedia(item)}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        aria-label="Delete media item"
                        size="sm"
                        variant="ghost"
                        bg="transparent"
                        colorPalette="red"
                        onClick={() => handleDeleteMedia(item.id, item.title)}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {totalMediaItems > mediaPerPage && !mediaSearchQuery && (
          <Flex mt={4} justify="space-between" align="center" gap={4}>
            <Button
              onClick={() => setMediaPage(mediaPage - 1)}
              disabled={mediaPage === 1}
              size="sm"
              bg="transparent"
              variant="outline"
            >
              Previous
            </Button>
            <Text fontSize="sm" color="fg.muted">
              Page {mediaPage} of {Math.ceil(totalMediaItems / mediaPerPage)}
            </Text>
            <Button
              onClick={() => setMediaPage(mediaPage + 1)}
              disabled={mediaPage >= Math.ceil(totalMediaItems / mediaPerPage)}
              size="sm"
              bg="transparent"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        )}

        {mediaSearchQuery && (
          <Text
            mt={2}
            fontSize="sm"
            color="fg.muted"
            textAlign="center"
          >
            Showing {filteredMediaItems.length} of {totalMediaItems} media items (filtered)
          </Text>
        )}
      </Box>

      {/* Edit Media Modal */}
      <DialogRoot open={mediaModalOpen} onOpenChange={(e) => setMediaModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent maxW="2xl">
            <DialogHeader>
              <DialogTitle>Edit Media Item</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {loadingMediaDetails ? (
                <Center py={8}>
                  <VStack gap={4}>
                    <Spinner size="lg" color="accent.500" />
                    <Text color="fg.muted">Loading media details...</Text>
                  </VStack>
                </Center>
              ) : (
                <VStack gap={4} align="stretch">
                  <Field label="Title" required>
                    <Input
                      value={editMediaTitle}
                      onChange={(e) => setEditMediaTitle(e.target.value)}
                      placeholder="Enter title"
                      disabled={loadingMediaDetails}
                    />
                  </Field>

                  <Field label="Creator/Author">
                    <Input
                      value={editMediaCreator}
                      onChange={(e) => setEditMediaCreator(e.target.value)}
                      placeholder="Enter creator or author name"
                    />
                  </Field>

                  <Field label="Cover Image URL">
                    <Input
                      value={editMediaCoverImage}
                      onChange={(e) => setEditMediaCoverImage(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                    />
                  </Field>

                  {editMediaCoverImage && (
                    <Box>
                      <Text fontSize="sm" color="fg.muted" mb={2}>
                        Preview:
                      </Text>
                      <Image
                        src={editMediaCoverImage}
                        alt="Cover preview"
                        w="120px"
                        h="180px"
                        objectFit="cover"
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor="border.card"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </Box>
                  )}

                  <Field label="Description">
                    <Textarea
                      value={editMediaDescription}
                      onChange={(e) => setEditMediaDescription(e.target.value)}
                      placeholder="Enter description"
                      rows={5}
                      resize="vertical"
                    />
                  </Field>

                  <Field label="Published Year">
                    <Input
                      type="number"
                      value={editMediaPublishedYear}
                      onChange={(e) => setEditMediaPublishedYear(e.target.value)}
                      placeholder="e.g., 2023"
                      min="1000"
                      max="9999"
                    />
                  </Field>

                  {editingMedia && (editingMedia.mediaType === 'book' || editingMedia.mediaType === 'movie' || editingMedia.mediaType === 'tv' || editingMedia.mediaType === 'course') && (
                    <Field label={
                      editingMedia.mediaType === 'book' ? 'Pages' :
                      editingMedia.mediaType === 'movie' ? 'Runtime (minutes)' :
                      editingMedia.mediaType === 'tv' ? 'Total Episodes' :
                      'Number of Modules'
                    }>
                      <Input
                        type="number"
                        value={editMediaLength}
                        onChange={(e) => setEditMediaLength(e.target.value)}
                        placeholder={
                          editingMedia.mediaType === 'book' ? 'Number of pages' :
                          editingMedia.mediaType === 'movie' ? 'Runtime in minutes' :
                          editingMedia.mediaType === 'tv' ? 'Total number of episodes' :
                          'Number of modules'
                        }
                        min="1"
                      />
                    </Field>
                  )}

                  {editingMedia && (
                    <Box p={3} bg="bg.muted" borderRadius="md" fontSize="sm">
                      <Text color="fg.muted">
                        <strong>Media Type:</strong> {editingMedia.mediaType}
                      </Text>
                      {editingMedia.isbn && (
                        <Text color="fg.muted">
                          <strong>ISBN:</strong> {editingMedia.isbn}
                        </Text>
                      )}
                      <Text color="fg.muted">
                        <strong>ID:</strong> {editingMedia.id}
                      </Text>
                    </Box>
                  )}

                  {/* Tags Section */}
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Tags
                    </Text>
                    {loadingTags ? (
                      <Center py={4}>
                        <Spinner size="sm" color="accent.500" />
                      </Center>
                    ) : mediaTags.length > 0 ? (
                      <Flex gap={2} flexWrap="wrap">
                        {mediaTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            colorPalette="accent"
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
                            <IconButton
                              size="2xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => handleRemoveTag(tag.id)}
                              aria-label="Remove tag"
                              bg="transparent"
                              h="14px"
                              minW="14px"
                              w="14px"
                              p={0}
                            >
                              <LuX size={10} />
                            </IconButton>
                          </Badge>
                        ))}
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        No tags on this item
                      </Text>
                    )}
                  </Box>
                </VStack>
              )}
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button
                  onClick={handleCloseMediaModal}
                  variant="outline"
                  bg="transparent"
                  disabled={savingMedia}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveMedia}
                  colorPalette="accent"
                  variant="outline"
                  bg="transparent"
                  disabled={!editMediaTitle || savingMedia}
                >
                  {savingMedia ? 'Saving...' : 'Save Changes'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  );
}
