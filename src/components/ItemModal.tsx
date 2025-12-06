import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  Portal,
} from '@chakra-ui/react';
import { Field } from './ui/field';
import { MediaSearch } from './MediaSearch';
import { StarRating } from './StarRating';
import { StarRatingSelector } from './StarRatingSelector';

export interface MediaSearchResult {
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

interface ReviewData {
  status: string;
  rating: number;
  review: string;
  notes: string;
  recommendedBy: string;
  completedAt: string;
}

export interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility: string;
  purpose: string;
  avatar: string | null;
  createdAt: string;
  itemCount?: number;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  apiUrl: string;
  mode: 'add' | 'edit';
  selectedMedia: MediaSearchResult | null;
  onMediaSelect: (media: MediaSearchResult) => void;
  reviewData: ReviewData;
  onReviewDataChange: (data: ReviewData) => void;
  itemTitle?: string;
  itemCreator?: string;
  itemCoverImage?: string;
  collections?: Collection[];
  currentListUri?: string;
  onListChange?: (listUri: string) => void;
  onCollectionsRefresh?: () => void;
}

const mediaTypeToText: (arg0: string | undefined) => any = (mediaType: string | undefined) => {
  switch (mediaType) {
    case 'book':
      return {
        searchText: 'Search for a book to add to your collection',
        displayText: 'Book',
        wantText: 'Want to Read',
        inProgressText: 'Currently Reading',
        completedText: 'Completed',
      };
    case 'movie':
      return {
        searchText: 'Search for a movie to add to your collection',
        displayText: 'Movie',
        wantText: 'Want to Watch',
        inProgressText: 'Currently Watching',
        completedText: 'Completed',
      };
    case 'tv':
      return {
        searchText: 'Search for a TV show to add to your collection',
        displayText: 'TV Show',
        wantText: 'Want to Watch',
        inProgressText: 'Currently Watching',
        completedText: 'Completed',
      };
    case 'podcast':
      return {
        searchText: 'Add a link to a podcast episode to add to your collection',
        displayText: 'Podcast',
        wantText: 'Want to Listen To',
        inProgressText: 'Currently Listening To',
        completedText: 'Completed',
      };
    case 'article':
      return {
        searchText: 'Add a link to an article to add to your collection',
        displayText: 'Article',
        wantText: 'Want to Read',
        inProgressText: 'Currently Reading',
        completedText: 'Completed',
      };
    case 'course':
      return {
        searchText: 'Add a link to a course to add to your collection',
        displayText: 'Course',
        wantText: 'Want to Do',
        inProgressText: 'In Progress',
        completedText: 'Completed',
      };
    case 'video':
      return {
        searchText: 'Add a link to a video to add to your collection',
        displayText: 'Video',
        wantText: 'Want to Watch',
        inProgressText: 'Currently Watching',
        completedText: 'Completed',
      };
    default:
      return {
        searchText: 'Search for something to add to your collection',
        displayText: 'Media',
        wantText: 'Want to Watch',
        inProgressText: 'Currently Watching',
        completedText: 'Completed',
      };
  }
}

export function ItemModal({
  isOpen,
  onClose,
  onSubmit,
  apiUrl,
  mode,
  selectedMedia,
  onMediaSelect,
  reviewData,
  onReviewDataChange,
  itemTitle,
  itemCreator,
  itemCoverImage,
  collections = [],
  currentListUri,
  onListChange,
  onCollectionsRefresh,
}: ItemModalProps) {
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedListUri, setSelectedListUri] = useState(currentListUri || '');
  const [isCreatingList, setIsCreatingList] = useState(false);

  if (!isOpen) return null;
  const mediaTypeText = mediaTypeToText(selectedMedia?.mediaType);
  const displayMedia = mode === 'edit'
    ? { title: itemTitle, author: itemCreator, coverImage: itemCoverImage }
    : selectedMedia;

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.700"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        onClick={onClose}
      >
        <Box
          bg="bg"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          p={6}
          maxW="600px"
          w="full"
          mx={4}
          maxH="90vh"
          overflowY="auto"
          onClick={(e) => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg">
              {mode === 'add' ? 'Add Item to Collection' : 'Edit Item'}
            </Heading>

            {mode === 'add' && !selectedMedia ? (
              <Box>
                <Text color="fg.muted" mb={4}>
                  {mediaTypeText.searchText}
                </Text>
                <MediaSearch apiUrl={apiUrl} onSelect={onMediaSelect} />
              </Box>
            ) : (
              <form onSubmit={onSubmit}>
                <VStack gap={4} align="stretch">
                  {/* Media Display */}
                  <Flex
                    gap={4}
                    p={4}
                    bg="bg.muted"
                    borderRadius="md"
                  >
                    {displayMedia?.coverImage && (
                      <img
                        src={displayMedia.coverImage}
                        alt={displayMedia.title || ''}
                        style={{
                          width: '60px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '0.375rem',
                        }}
                      />
                    )}
                    <Box flex={1}>
                      <Heading size="sm" mb={1}>
                        {displayMedia?.title}
                      </Heading>
                      {displayMedia?.author && (
                        <Text color="fg.muted" fontSize="sm">
                          by {displayMedia.author}
                        </Text>
                      )}
                      {mode === 'add' && selectedMedia?.inDatabase && selectedMedia.totalReviews > 0 && (
                        <HStack gap={2} mt={2} fontSize="sm">
                          <StarRating rating={selectedMedia.averageRating || 0} size="1em" />
                          <Text color="fg.muted">
                            {selectedMedia.averageRating?.toFixed(1)} ({selectedMedia.totalRatings}{' '}
                            {selectedMedia.totalRatings === 1 ? 'rating' : 'ratings'})
                          </Text>
                        </HStack>
                      )}
                    </Box>
                    {mode === 'add' && (
                      <Button
                        type="button"
                        variant="ghost"
                        background="transparent"
                        size="sm"
                        onClick={() => onMediaSelect(null as any)}
                      >
                        ×
                      </Button>
                    )}
                  </Flex>

                  {/* Status Buttons */}
                  <Field label="Status">
                    <HStack gap={2} width="100%">
                      <Button
                        flex={1}
                        size="md"
                        variant={reviewData.status === 'want' ? 'solid' : 'outline'}
                        colorPalette={reviewData.status === 'want' ? 'teal' : 'gray'}
                        bg={reviewData.status === 'want' ? 'teal.500' : 'transparent'}
                        onClick={() => onReviewDataChange({ ...reviewData, status: 'want' })}
                      >
                        {mediaTypeText.wantText}
                      </Button>
                      <Button
                        flex={1}
                        size="md"
                        variant={reviewData.status === 'in-progress' ? 'solid' : 'outline'}
                        colorPalette={reviewData.status === 'in-progress' ? 'teal' : 'gray'}
                        bg={reviewData.status === 'in-progress' ? 'teal.500' : 'transparent'}
                        onClick={() => onReviewDataChange({ ...reviewData, status: 'in-progress' })}
                      >
                        {mediaTypeText.inProgressText}
                      </Button>
                      <Button
                        flex={1}
                        size="md"
                        variant={reviewData.status === 'completed' ? 'solid' : 'outline'}
                        colorPalette={reviewData.status === 'completed' ? 'teal' : 'gray'}
                        bg={reviewData.status === 'completed' ? 'teal.500' : 'transparent'}
                        onClick={() => onReviewDataChange({ ...reviewData, status: 'completed' })}
                      >
                        {mediaTypeText.completedText}
                      </Button>
                    </HStack>
                  </Field>

                  {/* Completed Date (only if status is completed) */}
                  {reviewData.status === 'completed' && (
                    <Field label="Finished on (optional)">
                      <Input
                        type="date"
                        value={reviewData.completedAt}
                        onChange={(e) =>
                          onReviewDataChange({ ...reviewData, completedAt: e.target.value })
                        }
                      />
                    </Field>
                  )}

                  {/* List Selector (only in edit mode) */}
                  {mode === 'edit' && collections.length > 0 && (
                    <Field label="Collection">
                      {!isCreatingNewList ? (
                        <>
                          <select
                            value={selectedListUri}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '__create_new__') {
                                setIsCreatingNewList(true);
                              } else {
                                setSelectedListUri(value);
                                if (onListChange && value !== currentListUri) {
                                  onListChange(value);
                                }
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem 0.75rem',
                              backgroundColor: 'var(--chakra-colors-bg-muted)',
                              border: '1px solid var(--chakra-colors-border)',
                              borderRadius: '0.375rem',
                              fontSize: '1rem',
                              color: 'inherit',
                            }}
                          >
                            {[...collections]
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((collection) => (
                                <option key={collection.uri} value={collection.uri}>
                                  {collection.name}
                                </option>
                              ))}
                            <option value="__create_new__">+ Create New List</option>
                          </select>
                          {selectedListUri !== currentListUri && (
                            <Text color="black" fontSize="sm" mt={1}>
                              Note: Saving will move this item to the selected collection
                            </Text>
                          )}
                        </>
                      ) : (
                        <VStack gap={2} align="stretch">
                          <Input
                            placeholder="New list name"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            autoFocus
                          />
                          <HStack gap={2}>
                            <Button
                              size="sm"
                              colorPalette="teal"
                              bg="transparent"
                              onClick={async () => {
                                if (!newListName.trim()) {
                                  alert('Please enter a list name');
                                  return;
                                }
                                setIsCreatingList(true);
                                try {
                                  const response = await fetch(`${apiUrl}/collections`, {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: newListName,
                                      visibility: 'public',
                                    }),
                                  });
                                  if (response.ok) {
                                    const data = await response.json();
                                    setSelectedListUri(data.uri);
                                    if (onListChange) {
                                      onListChange(data.uri);
                                    }
                                    if (onCollectionsRefresh) {
                                      onCollectionsRefresh();
                                    }
                                    setIsCreatingNewList(false);
                                    setNewListName('');
                                  } else {
                                    throw new Error('Failed to create list');
                                  }
                                } catch (err) {
                                  console.error('Failed to create list:', err);
                                  alert('Failed to create new list');
                                } finally {
                                  setIsCreatingList(false);
                                }
                              }}
                              disabled={isCreatingList}
                            >
                              {isCreatingList ? 'Creating...' : 'Create'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setIsCreatingNewList(false);
                                setNewListName('');
                              }}
                              disabled={isCreatingList}
                            >
                              Cancel
                            </Button>
                          </HStack>
                        </VStack>
                      )}
                    </Field>
                  )}

                  {reviewData.status === 'completed' && (
                    <>
                      {/* Rating */}
                      <Field label="Rating (0-5 stars)">
                        <HStack gap={2}>
                          <StarRatingSelector
                            rating={reviewData.rating}
                            onChange={(r) => onReviewDataChange({ ...reviewData, rating: r })}
                          />
                          <Text color="fg.muted" fontSize="sm">
                            {reviewData.rating.toFixed(1)}
                          </Text>
                        </HStack>
                      </Field>

                      {/* Public Review */}
                      <Field label="📝 Review (optional)">
                        <Textarea
                          value={reviewData.review}
                          onChange={(e) =>
                            onReviewDataChange({ ...reviewData, review: e.target.value })
                          }
                          rows={3}
                          placeholder="Share your review..."
                        />
                      </Field>
                    </>
                  )}

                  {/* Private Notes */}
                  <Field label="Notes">
                    <Textarea
                      value={reviewData.notes}
                      onChange={(e) =>
                        onReviewDataChange({ ...reviewData, notes: e.target.value })
                      }
                      rows={3}
                      placeholder="Private notes about this..."
                    />
                  </Field>

                  {/* Recommended By (only in add mode) */}
                  {mode === 'add' && (
                    <Field label="Recommended by (optional)">
                      <Input
                        value={reviewData.recommendedBy}
                        onChange={(e) =>
                          onReviewDataChange({ ...reviewData, recommendedBy: e.target.value })
                        }
                        placeholder="did:plc:xxx or handle.bsky.social"
                      />
                      <Text color="fg.muted" fontSize="xs" mt={1}>
                        Enter the DID or handle of who recommended this to you
                      </Text>
                    </Field>
                  )}

                  {/* Action Buttons */}
                  <Flex justify="flex-end" gap={3} pt={2}>
                    <Button type="button" variant="outline" bg="transparent" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" colorPalette="teal" bg="teal">
                      {mode === 'add' ? 'Add Item' : 'Save Changes'}
                    </Button>
                  </Flex>
                </VStack>
              </form>
            )}
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}
