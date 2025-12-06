import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';

interface ReviewSegment {
  uri: string;
  cid: string;
  value: {
    text: string;
    percentage: number;
    title?: string;
    mediaItemId?: number;
    mediaType?: string;
    listItem?: string;
    createdAt: string;
  };
}

interface ReviewSegmentsViewerProps {
  userDid: string;
  mediaItemId: number;
  mediaType: string;
  itemLength: number | null;
  apiUrl: string;
}

export function ReviewSegmentsViewer({
  userDid,
  mediaItemId,
  mediaType,
  itemLength,
  apiUrl,
}: ReviewSegmentsViewerProps) {
  const [segments, setSegments] = useState<ReviewSegment[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate highest percentage for progress bar
  const highestPercentage = segments.length > 0
    ? Math.max(...segments.map(s => s.value.percentage))
    : 0;

  useEffect(() => {
    fetchSegments();
  }, [userDid, mediaItemId]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${apiUrl}/reviewsegments/user/${userDid}?mediaItemId=${mediaItemId}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (err) {
      console.error('Failed to fetch review segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLengthUnit = () => {
    switch (mediaType) {
      case 'book':
        return 'pages';
      case 'movie':
        return 'minutes';
      case 'tv':
        return 'episodes';
      case 'podcast':
        return 'minutes';
      case 'course':
        return 'modules';
      default:
        return 'units';
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="fg.muted" fontSize="sm">Loading progress journey...</Text>
      </Box>
    );
  }

  if (segments.length === 0) {
    return null;
  }

  return (
    <Box>
      <Heading size="sm" mb={3}>Reading Journey</Heading>

      {/* Progress Bar */}
      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            Progress
          </Text>
          <Text fontSize="sm" color="teal.500" fontWeight="bold">
            {highestPercentage}%
          </Text>
        </Flex>
        <Progress.Root value={highestPercentage} max={100} colorPalette="teal">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        {itemLength && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            ~{Math.round((highestPercentage / 100) * itemLength)} of {itemLength} {getLengthUnit()}
          </Text>
        )}
      </Box>

      {/* Segments */}
      <VStack gap={3} align="stretch">
        {segments.map((segment) => (
          <Box
            key={segment.uri}
            bg="bg.subtle"
            borderRadius="md"
            p={3}
            borderWidth="1px"
            borderColor="border"
          >
            <Flex justify="space-between" align="flex-start" mb={2}>
              <Box flex="1">
                {segment.value.title && (
                  <Text fontWeight="medium" fontSize="sm" mb={1}>
                    {segment.value.title}
                  </Text>
                )}
                <Text fontSize="xs" color="teal.500" fontWeight="bold">
                  At {segment.value.percentage}%
                  {itemLength && (
                    <> (~{Math.round((segment.value.percentage / 100) * itemLength)} {getLengthUnit()})</>
                  )}
                </Text>
              </Box>
            </Flex>
            <Text fontSize="sm" lineHeight="1.6">
              {segment.value.text}
            </Text>
            <Text fontSize="xs" color="fg.muted" mt={2}>
              {new Date(segment.value.createdAt).toLocaleDateString()}
            </Text>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
