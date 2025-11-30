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
}: ItemModalProps) {
  if (!isOpen) return null;



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
                  Search for a book to add to your collection
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
                            {selectedMedia.averageRating?.toFixed(1)} ({selectedMedia.totalReviews}{' '}
                            {selectedMedia.totalReviews === 1 ? 'review' : 'reviews'})
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

                  {/* Status Selector (only in add mode) */}
                  {mode === 'add' && (
                    <Field label="Status">
                      <select
                        value={reviewData.status}
                        onChange={(e) =>
                          onReviewDataChange({ ...reviewData, status: e.target.value })
                        }
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
                        <option value="want">Want to Read</option>
                        <option value="in-progress">Currently Reading</option>
                        <option value="completed">Completed</option>
                      </select>
                    </Field>
                  )}

                  {/* Completed Date (only if status is completed) */}
                  {mode === 'add' && reviewData.status === 'completed' && (
                    <Field label="Finished reading on (optional)">
                      <Input
                        type="date"
                        value={reviewData.completedAt}
                        onChange={(e) =>
                          onReviewDataChange({ ...reviewData, completedAt: e.target.value })
                        }
                      />
                    </Field>
                  )}

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
                  <Field label="📝 Public Review (optional)">
                    <Textarea
                      value={reviewData.review}
                      onChange={(e) =>
                        onReviewDataChange({ ...reviewData, review: e.target.value })
                      }
                      rows={3}
                      placeholder="Share your review publicly..."
                    />
                    <Text color="fg.muted" fontSize="xs" mt={1}>
                      This will be visible to everyone and stored in the database
                    </Text>
                  </Field>

                  {/* Private Notes */}
                  <Field label="🔒 Private Notes (optional)">
                    <Textarea
                      value={reviewData.notes}
                      onChange={(e) =>
                        onReviewDataChange({ ...reviewData, notes: e.target.value })
                      }
                      rows={3}
                      placeholder="Private notes only you can see..."
                    />
                    <Text color="fg.muted" fontSize="xs" mt={1}>
                      Only visible to you, stored in your ATProto repository
                    </Text>
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
