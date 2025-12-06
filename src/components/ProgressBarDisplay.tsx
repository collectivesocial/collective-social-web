import { useState, useEffect } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { Progress } from '@chakra-ui/react';

interface ReviewSegment {
  uri: string;
  cid: string;
  value: {
    percentage: number;
  };
}

interface ProgressBarDisplayProps {
  listItemUri: string;
  itemLength: number | null;
  mediaType: string | null;
  apiUrl: string;
}

export function ProgressBarDisplay({
  listItemUri,
  itemLength,
  mediaType,
  apiUrl,
}: ProgressBarDisplayProps) {
  const [segments, setSegments] = useState<ReviewSegment[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate highest percentage for progress bar
  const highestPercentage = segments.length > 0
    ? Math.max(...segments.map(s => s.value.percentage))
    : 0;

  useEffect(() => {
    fetchSegments();
  }, [listItemUri]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const encodedUri = encodeURIComponent(listItemUri);
      const response = await fetch(`${apiUrl}/reviewsegments/list/${encodedUri}`, {
        credentials: 'include',
      });

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
      case 'video':
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

  // Don't show anything if no progress yet and not loading
  if (!loading && segments.length === 0 && !itemLength) {
    return null;
  }

  // Show progress if there are segments OR if there's a length (potential for progress)
  if (!loading && (segments.length > 0 || itemLength)) {
    return (
      <Box mt={3} pt={3} borderTopWidth="1px" borderTopColor="border">
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="xs" fontWeight="medium" color="fg.muted">
            Progress
          </Text>
          <Text fontSize="xs" color="teal.500" fontWeight="bold">
            {highestPercentage}%
          </Text>
        </Flex>
        <Progress.Root value={highestPercentage} max={100} colorPalette="teal" size="sm">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        {itemLength && highestPercentage > 0 && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            ~{Math.round((highestPercentage / 100) * itemLength)} of {itemLength} {getLengthUnit()}
          </Text>
        )}
        {segments.length > 0 && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            {segments.length} {segments.length === 1 ? 'note' : 'notes'}
          </Text>
        )}
      </Box>
    );
  }

  return null;
}
