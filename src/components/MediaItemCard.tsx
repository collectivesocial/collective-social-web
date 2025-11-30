import { Box, Flex, Text, Badge, Button, HStack, Heading } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface Recommendation {
  did: string;
  suggestedAt: string;
  handle?: string;
}

interface MediaItem {
  id: number;
  isbn: string | null;
  externalId: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  totalReviews: number;
  averageRating: number | null;
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
  mediaItem?: MediaItem;
}

interface MediaItemCardProps {
  item: ListItem;
  recommenderHandles: Record<string, string>;
  isOwner: boolean;
  onShare: (item: ListItem) => void;
  onEdit: (item: ListItem) => void;
  onDelete: (itemUri: string) => void;
}

export function MediaItemCard({
  item,
  recommenderHandles,
  isOwner,
  onShare,
  onEdit,
  onDelete,
}: MediaItemCardProps) {
  const navigate = useNavigate();

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    return (
      <>
        {'⭐'.repeat(fullStars)}
        {hasHalfStar && '✨'}
      </>
    );
  };

  return (
    <Box
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <Flex gap={{ base: 3, md: 4 }} direction={{ base: 'column', sm: 'row' }}>
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
            </Box>

            <HStack
              gap={2}
              flexWrap="wrap"
              justify={{ base: 'flex-start', md: 'flex-end' }}
              flexShrink={0}
            >
              {item.status && (
                <Badge colorPalette="gray" variant="subtle" fontSize="xs" textTransform="capitalize">
                  {item.status.replace('-', ' ')}
                </Badge>
              )}
              <Button
                size="xs"
                variant="outline"
                colorPalette="green"
                onClick={() => onShare(item)}
              >
                🔗 Share
              </Button>
              {isOwner && (
                <>
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="teal"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => onDelete(item.uri)}
                  >
                    Delete
                  </Button>
                </>
              )}
            </HStack>
          </Flex>

          {item.rating !== null && item.rating > 0 && (
            <Flex align="center" gap={2} mb={2}>
              <Text color="yellow.400" fontSize="sm">
                {renderStars(item.rating)}
              </Text>
              <Text color="fg.muted" fontSize="sm">
                {item.rating.toFixed(1)}
              </Text>
            </Flex>
          )}

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

          {item.mediaItem && item.mediaItem.totalReviews > 1 && (
            <Box
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderTopColor="border"
              cursor="pointer"
              onClick={() => item.mediaItemId && navigate(`/items/${item.mediaItemId}`)}
            >
              <Text color="fg.muted" fontSize="xs">
                Community: ⭐{' '}
                {typeof item.mediaItem.averageRating === 'number'
                  ? item.mediaItem.averageRating.toFixed(1)
                  : 'N/A'}{' '}
                ({item.mediaItem.totalReviews} reviews)
              </Text>
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
