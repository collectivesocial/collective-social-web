import { Box, Flex, Text, Badge, Button, HStack, Heading, VStack, IconButton } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { LuArrowUp, LuArrowDown } from 'react-icons/lu';
import { ShareButton } from './ShareButton';
import { StarRating } from './StarRating';

interface Recommendation {
  did: string;
  suggestedAt: string;
  handle?: string;
}

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
  isbn: string | null;
  externalId: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  length: number | null;
  totalRatings: number;
  totalReviews: number;
  averageRating: number | null;
  ratingDistribution?: RatingDistribution;
}

export interface ListItem {
  uri: string;
  cid: string;
  title: string;
  creator: string | null;
  order: number;
  mediaType: string | null;
  mediaItemId: number | null;
  status: string | null;
  rating: number | null;
  review: string | null;
  notes: string | null;
  recommendations: Recommendation[];
  createdAt: string;
  mediaItem?: MediaItem;
}

interface MediaItemCardProps {
  item: ListItem;
  recommenderHandles: Record<string, string>;
  isOwner: boolean;
  isReorderMode?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  apiUrl: string;
  onEdit: (item: ListItem) => void;
  onDelete: (itemUri: string) => void;
  onMoveUp?: (item: ListItem) => void;
  onMoveDown?: (item: ListItem) => void;
}

export function MediaItemCard({
  item,
  recommenderHandles,
  isOwner,
  isReorderMode,
  canMoveUp,
  canMoveDown,
  apiUrl,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: MediaItemCardProps) {
  const navigate = useNavigate();

  return (
    <Box
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <Flex gap={{ base: 3, md: 4 }} direction={{ base: 'column', sm: 'row' }}>
        {isReorderMode && (
          <VStack gap={1} flexShrink={0}>
            <IconButton
              aria-label="Move up"
              size="xs"
              variant="outline"
              bg="transparent"
              onClick={() => onMoveUp?.(item)}
              disabled={!canMoveUp}
            >
              <LuArrowUp />
            </IconButton>
            <IconButton
              aria-label="Move down"
              size="xs"
              variant="outline"
              bg="transparent"
              onClick={() => onMoveDown?.(item)}
              disabled={!canMoveDown}
            >
              <LuArrowDown />
            </IconButton>
          </VStack>
        )}
        {item.mediaItem?.coverImage && (
          <img
            src={item.mediaItem.coverImage}
            alt={item.title}
            style={{
              width: '80px',
              height: '120px',
              objectFit: 'cover',
              borderRadius: '0.375rem',
              flexShrink: 0,
              cursor: item.mediaItemId ? 'pointer' : 'default',
              alignSelf: 'center',
            }}
            onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
          />
        )}

        <Box flex={1} minW={0}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'flex-start' }}
            mb={2}
            gap={3}
          >
            <Box flex={1} minW={0}>
              <Heading
                size="md"
                cursor={item.mediaItemId ? 'pointer' : 'default'}
                color={item.mediaItemId ? 'teal.500' : 'inherit'}
                _hover={item.mediaItemId ? { color: 'teal.600' } : {}}
                onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
                mb={1}
              >
                {item.title}
              </Heading>
              {item.creator && (
                <Text color="fg.muted" fontSize="sm" mb={2}>
                  by {item.creator}
                </Text>
              )}
              {item.mediaType === 'book' && item.mediaItem?.length && (
                <Text color="fg.muted" fontSize="xs" mb={2}>
                  {item.mediaItem.length} pages
                </Text>
              )}
              {item.mediaType === 'course' && item.mediaItem?.length && (
                <Text color="fg.muted" fontSize="xs" mb={2}>
                  {item.mediaItem.length} modules
                </Text>
              )}
              {(item.mediaType === 'movie' || item.mediaType === 'video') && item.mediaItem?.length && (
                <Text color="fg.muted" fontSize="xs" mb={2}>
                  {Math.floor(item.mediaItem.length / 60)}h {item.mediaItem.length % 60}m
                </Text>
              )}
              {item.mediaType === 'tv' && item.mediaItem?.length && (
                <Text color="fg.muted" fontSize="xs" mb={2}>
                  {item.mediaItem.length} episodes
                </Text>
              )}
            </Box>

            <HStack
              gap={2}
              flexWrap="wrap"
              justify={{ base: 'flex-start', md: 'flex-end' }}
              flexShrink={0}
            >
              {item.mediaType && (
                <Badge colorPalette="teal" variant="subtle" fontSize="xs" textTransform="capitalize">
                  {item.mediaType}
                </Badge>
              )}
              {item.status && (
                <Badge colorPalette="gray" variant="subtle" fontSize="xs" textTransform="capitalize">
                  {item.status.replace('-', ' ')}
                </Badge>
              )}
              {item.mediaItemId && (
                <ShareButton
                  apiUrl={apiUrl}
                  mediaItemId={item.mediaItemId}
                  mediaType={item.mediaType || 'book'}
                  size="xs"
                  variant="outline"
                />
              )}
              {isOwner && (
                <>
                  <Button
                    size="xs"
                    variant="outline"
                    bg="transparent"
                    colorPalette="teal"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    bg="transparent"
                    onClick={() => onDelete(item.uri)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </HStack>
          </Flex>

          {item.review && (
            <Box mt={3}>
              <Text color="fg.muted" fontSize="xs" mb={1}>
                📝 Public Review:
              </Text>
              <Text fontSize="sm" lineHeight="1.6">
                {item.review}
              </Text>
            </Box>
          )}

          {item.notes && (
            <Box mt={3}>
              <Text color="fg.muted" fontSize="xs" mb={1}>
                🔒 Private Notes:
              </Text>
              <Text fontSize="sm" lineHeight="1.6" fontStyle="italic">
                {item.notes}
              </Text>
            </Box>
          )}

          {item.mediaItem && item.mediaItem.totalRatings > 0 && (
            <Box
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderTopColor="border"
              cursor="pointer"
              onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
            >
              <Flex align="center" gap={4} flexWrap="wrap">
                {item.rating !== null && item.rating > 0 && (
                  <Flex align="center" gap={2}>
                    <Text color="fg.muted" fontSize="xs">
                      Your rating:
                    </Text>
                    <StarRating rating={item.rating} size="0.875rem" />
                    <Text color="fg.muted" fontSize="xs">
                      {item.rating.toFixed(1)}
                    </Text>
                  </Flex>
                )}
                <Flex align="center" gap={2}>
                  <Text color="fg.muted" fontSize="xs">
                    Community:
                  </Text>
                  <StarRating rating={item.mediaItem.averageRating || 0} size="0.875rem" />
                  <Text color="fg.muted" fontSize="xs">
                    {typeof item.mediaItem.averageRating === 'number'
                      ? item.mediaItem.averageRating.toFixed(1)
                      : 'N/A'}{' '}
                    ({item.mediaItem.totalRatings} ratings)
                  </Text>
                </Flex>
              </Flex>
            </Box>
          )}

          {item.recommendations && item.recommendations.length > 0 && (
            <Box mt={3} pt={3} borderTopWidth="1px" borderTopColor="border">
              <Text color="fg.muted" fontSize="xs" mb={2}>
                💡 Recommended by:
              </Text>
              {item.recommendations.map((rec, idx) => (
                <Flex key={idx} ml={4} mt={1} gap={2} align="center" flexWrap="wrap">
                  <a
                    href={`https://bsky.app/profile/${rec.did}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--chakra-colors-teal-500)',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = 'var(--chakra-colors-teal-600)';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = 'var(--chakra-colors-teal-500)';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    @{recommenderHandles[rec.did] || rec.did.substring(0, 24) + '...'}
                  </a>
                  <Text color="fg.muted" fontSize="xs">
                    ({new Date(rec.suggestedAt).toLocaleDateString()})
                  </Text>
                </Flex>
              ))}
            </Box>
          )}

          <Box mt={3}>
            <Text color="fg.muted" fontSize="xs">
              Added {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
