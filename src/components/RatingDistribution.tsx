import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { useState } from 'react';
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

interface RatingDistributionProps {
  distribution: RatingDistribution;
  totalRatings: number;
}

const ratingValues = [5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5, 0] as const;

export function RatingDistributionDisplay({ distribution, totalRatings }: RatingDistributionProps) {
  const [expanded, setExpanded] = useState(false);

  if (totalRatings === 0) {
    return null;
  }

  const getRatingCount = (rating: number): number => {
    const key = `rating${rating.toString().replace('.', '_')}` as keyof RatingDistribution;
    return distribution[key] || 0;
  };

  const getRatingPercentage = (rating: number): number => {
    const count = getRatingCount(rating);
    return totalRatings > 0 ? (count / totalRatings) * 100 : 0;
  };

  const maxCount = Math.max(...ratingValues.map(getRatingCount));

  return (
    <Box>
      <Box
        cursor="pointer"
        onClick={() => setExpanded(!expanded)}
        _hover={{ opacity: 0.8 }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
      >
        <Text fontSize="sm" color="gray.600" textDecoration="underline">
          {expanded ? 'Hide' : 'Show'} rating breakdown
        </Text>
      </Box>

      {expanded && (
        <VStack gap={2} mt={4} align="stretch">
          {ratingValues.map((rating) => {
            const count = getRatingCount(rating);
            const percentage = getRatingPercentage(rating);
            const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

            return (
              <HStack key={rating} gap={3}>
                <Box width="80px" flexShrink={0}>
                  <StarRating rating={rating} size="14px" />
                </Box>
                <Box flex={1} position="relative" height="20px">
                  <Box
                    position="absolute"
                    left={0}
                    top={0}
                    bottom={0}
                    width={`${barWidth}%`}
                    bg="accent.500"
                    borderRadius="sm"
                    transition="width 0.3s"
                  />
                </Box>
                <Box width="80px" flexShrink={0} textAlign="right">
                  <Text fontSize="sm" color="gray.700">
                    {percentage.toFixed(1)}% ({count})
                  </Text>
                </Box>
              </HStack>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
