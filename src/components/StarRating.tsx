import { HStack } from '@chakra-ui/react';
import { LuStar, LuStarHalf } from 'react-icons/lu';

interface StarRatingProps {
  rating: number;
  size?: string;
  color?: string;
}

export function StarRating({ rating, size = '1em', color = 'accent.500' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <HStack gap={0.5}>
      {[...Array(fullStars)].map((_, i) => (
        <LuStar key={`full-${i}`} size={size} color={color} fill={color} />
      ))}
      {hasHalfStar && <LuStarHalf size={size} color={color} fill={color} />}
      {[...Array(emptyStars)].map((_, i) => (
        <LuStar key={`empty-${i}`} size={size} color="gray" />
      ))}
    </HStack>
  );
}
