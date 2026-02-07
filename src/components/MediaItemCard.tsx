import { Box, Flex, Text, Badge, HStack, Heading, VStack, IconButton, Image, Link } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { LuArrowUp, LuArrowDown, LuPencil, LuTrash2, LuExternalLink } from 'react-icons/lu';
import { ShareButton } from './ShareButton';
import { StarRating } from './StarRating';
import { ProgressBarDisplay } from './ProgressBarDisplay';

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
  url?: string | null;
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
  completedAt?: string | null;
  userItemUri?: string | null;
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
  onClick?: (item: ListItem) => void;
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
  onClick,
}: MediaItemCardProps) {
  const navigate = useNavigate();

  return (
    <Box
      bg="bg.card"
      borderWidth="1px"
      borderColor="border.card"
      borderRadius="xl"
      overflow="hidden"
      h="full"
      display="flex"
      flexDirection="column"
      pb={3}
      transition="all 0.25s ease"
      _hover={{
        shadow: 'md',
        borderColor: 'border.focus',
        transform: 'translateY(-2px)',
      }}
    >
      <Flex gap={0} direction="column" flex={1}>
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
          <Image
            src={item.mediaItem.coverImage}
            alt={item.title}
            w="100%"
            h="220px"
            objectFit="cover"
            cursor="pointer"
            onClick={() => onClick ? onClick(item) : item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
          />
        )}

        <Box px={4} pt={3}>
          <Heading
            size="sm"
            fontFamily="heading"
            cursor="pointer"
            color={item.mediaItemId ? 'accent.default' : 'fg.default'}
            _hover={{ color: 'accent.hover' }}
            onClick={() => onClick ? onClick(item) : item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
            mb={1}
            textAlign="left"
            lineClamp={2}
            lineHeight="1.3"
          >
            {item.title}
          </Heading>
          {item.creator && (
            <Text color="fg.muted" fontSize="sm" mb={2} textAlign="left" lineClamp={1} fontStyle="italic">
              by {item.creator}
            </Text>
          )}
          {item.mediaType === 'book' && item.mediaItem?.length && (
            <Text color="fg.muted" fontSize="xs" mb={2} textAlign="left">
              {item.mediaItem.length} pages
            </Text>
          )}
          {item.mediaType === 'course' && item.mediaItem?.length && (
            <Text color="fg.muted" fontSize="xs" mb={2} textAlign="left">
              {item.mediaItem.length} modules
            </Text>
          )}
          {(item.mediaType === 'movie' || item.mediaType === 'video') && item.mediaItem?.length && (
            <Text color="fg.muted" fontSize="xs" mb={2} textAlign="left">
              {Math.floor(item.mediaItem.length / 60)}h {item.mediaItem.length % 60}m
            </Text>
          )}
          {item.mediaType === 'tv' && item.mediaItem?.length && (
            <Text color="fg.muted" fontSize="xs" mb={2} textAlign="left">
              {item.mediaItem.length} episodes
            </Text>
          )}
        </Box>
      </Flex>

      <HStack
        gap={2}
        flexWrap="wrap"
        justify={{ base: 'flex-start', md: 'flex-end' }}
        mt="auto"
        px={4}
        pt={3}
        pb={1}
      >
              {item.mediaType && (
                <Badge colorPalette="accent" variant="subtle" fontSize="xs" textTransform="capitalize">
                  {item.mediaType}
                </Badge>
              )}
              {item.mediaItem?.url && (
                <Link
                  href={item.mediaItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  display="inline-flex"
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
                </Link>
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
                  <IconButton
                    size="xs"
                    variant="outline"
                    bg="transparent"
                    color={{ base: 'white', _light: 'black' }}
                    _hover={{ bg: { base: 'whiteAlpha.200', _light: 'blackAlpha.100' } }}
                    onClick={() => onEdit(item)}
                    aria-label="Edit item"
                  >
                    <LuPencil />
                  </IconButton>
                  <IconButton
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    bg="transparent"
                    onClick={() => onDelete(item.uri)}
                    aria-label="Delete item"
                  >
                    <LuTrash2 />
                  </IconButton>
                </>
              )}
      </HStack>

      {item.review && (
        <Box mx={4} mt={3} p={3} bg="bg.subtle" borderRadius="lg">
          <Text color="fg.muted" fontSize="xs" mb={1} fontWeight="600">
            📝 Public Review
          </Text>
          <Text fontSize="sm" lineHeight="1.7" fontStyle="italic">
            {item.review}
          </Text>
        </Box>
      )}

      {item.notes && (
        <Box mx={4} mt={3} p={3} bg="bg.subtle" borderRadius="lg">
          <Text color="fg.muted" fontSize="xs" mb={1} fontWeight="600">
            🔒 Private Notes
          </Text>
          <Text fontSize="sm" lineHeight="1.7" fontStyle="italic">
            {item.notes}
          </Text>
        </Box>
      )}

      {item.status === 'in-progress' && isOwner && (
        <Box px={4}>
          <ProgressBarDisplay
            listItemUri={item.uri}
            itemLength={item.mediaItem?.length || null}
            mediaType={item.mediaType}
            apiUrl={apiUrl}
          />
        </Box>
      )}

      {item.mediaItem && item.mediaItem.totalRatings > 0 && (
        <Box
          mx={4}
          mt={3}
          pt={3}
          borderTopWidth="1px"
          borderTopColor="border.subtle"
          cursor="pointer"
          onClick={() => onClick ? onClick(item) : item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
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
        <Box mx={4} mt={3} mb={2} pt={3} borderTopWidth="1px" borderTopColor="border.subtle">
          <Text color="fg.muted" fontSize="xs" mb={2}>
            💡 Recommended by:
          </Text>
          {item.recommendations.map((rec, idx) => (
            <Flex key={idx} ml={4} mt={1} gap={2} align="center" flexWrap="wrap">
              <Link
                href={`https://bsky.app/profile/${rec.did}`}
                target="_blank"
                rel="noopener noreferrer"
                color="accent.default"
                fontSize="xs"
                _hover={{ color: 'accent.hover', textDecoration: 'underline' }}
              >
                @{recommenderHandles[rec.did] || rec.did.substring(0, 24) + '...'}
              </Link>
              <Text color="fg.muted" fontSize="xs">
                ({new Date(rec.suggestedAt).toLocaleDateString()})
              </Text>
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  );
}
