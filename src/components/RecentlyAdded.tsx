import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Image,
  SimpleGrid,
  VStack,
  Flex,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { StarRating } from './StarRating';

interface RecentMediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  coverImage: string | null;
  publishedYear: number | null;
  averageRating: number | null;
  totalReviews: number;
  totalRatings: number;
  createdAt: string;
}

interface RecentlyAddedProps {
  apiUrl: string;
  limit?: number;
}

export function RecentlyAdded({ apiUrl, limit = 6 }: RecentlyAddedProps) {
  const [recentItems, setRecentItems] = useState<RecentMediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/media/recent?limit=${limit}`)
      .then((res) => res.json())
      .then((data) => {
        setRecentItems(data.items);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch recent items:', err);
        setLoading(false);
      });
  }, [apiUrl, limit]);

  return (
    <Box
      p={6}
      bg="bg.card"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.card"
      position={{ base: 'relative', lg: 'sticky' }}
      top={{ lg: '80px' }}
    >
      <Heading size="md" fontFamily="heading" mb={4}>
        Recently Added
      </Heading>
      {loading ? (
        <Center py={8}>
          <Spinner size="lg" color="accent.500" />
        </Center>
      ) : (
        <SimpleGrid columns={2} gap={3}>
          {recentItems.map((item) => (
            <Box
              key={item.id}
              cursor="pointer"
              onClick={() => navigate(`/items/${item.id}`)}
              transition="all 0.2s ease"
              _hover={{ transform: 'translateY(-2px)' }}
            >
              <VStack gap={2} align="stretch">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    w="100%"
                    aspectRatio="2/3"
                    objectFit="cover"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    transition="transform 0.2s ease"
                  />
                ) : (
                  <Flex
                    w="100%"
                    aspectRatio="2/3"
                    bg="bg.subtle"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    align="center"
                    justify="center"
                  >
                    <Text fontSize="4xl" opacity={0.3}>
                      📚
                    </Text>
                  </Flex>
                )}
                <VStack gap={0.5} align="stretch">
                  <Text
                    fontSize="xs"
                    fontWeight="medium"
                    lineClamp={2}
                    lineHeight="1.3"
                  >
                    {item.title}
                  </Text>
                  {item.creator && (
                    <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                      {item.creator}
                    </Text>
                  )}
                  {item.averageRating !== null && item.totalReviews > 0 && (
                    <Flex align="center" gap={1}>
                      <StarRating rating={item.averageRating} size="0.65rem" />
                      <Text fontSize="xs" color="fg.muted">
                        {item.averageRating.toFixed(1)}
                      </Text>
                    </Flex>
                  )}
                </VStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
