import { HStack, Box } from '@chakra-ui/react';
import { LuStar } from 'react-icons/lu';
import { useState } from 'react';

interface StarRatingSelectorProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: string;
}

export function StarRatingSelector({ rating, onChange, size = '24px' }: StarRatingSelectorProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const displayRating = hoveredRating !== null ? hoveredRating : rating;

  const handleStarClick = (e: React.MouseEvent, star: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    const newRating = isLeftHalf ? star - 0.5 : star;
    
    onChange(newRating);
  };

  const handleStarMove = (e: React.MouseEvent, star: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    const newRating = isLeftHalf ? star - 0.5 : star;
    
    setHoveredRating(newRating);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const possibleRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const currentIndex = possibleRatings.indexOf(rating);

    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      const nextIndex = Math.min(currentIndex + 1, possibleRatings.length - 1);
      onChange(possibleRatings[nextIndex]);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      e.stopPropagation();
      const prevIndex = Math.max(currentIndex - 1, 0);
      onChange(possibleRatings[prevIndex]);
    }
  };

  const getStarFill = (star: number) => {
    if (displayRating >= star) return 'full';
    if (displayRating >= star - 0.5) return 'half';
    return 'none';
  };

  return (
    <Box
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      outline="none"
      _focusVisible={{
        boxShadow: '0 0 0 3px var(--chakra-colors-teal-500)',
        borderRadius: 'md',
      }}
    >
      <HStack gap={1}>
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = getStarFill(star);
          
          return (
            <Box
              key={star}
              as="button"
              bg="transparent"
              cursor="pointer"
              padding="4px"
              transition="transform 0.2s"
              _hover={{ transform: 'scale(1.1)' }}
              onClick={(e) => handleStarClick(e, star)}
              onMouseMove={(e) => handleStarMove(e, star)}
              onMouseLeave={() => setHoveredRating(null)}
              tabIndex={-1}
              aria-hidden="true"
            >
              <Box position="relative" display="inline-block" width={size} height={size}>
                {fill === 'half' ? (
                  <>
                    {/* Empty star background */}
                    <LuStar
                      size={size}
                      color="var(--chakra-colors-gray-300)"
                      fill="none"
                    />
                    {/* Half-filled star overlay */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      width="50%"
                      overflow="hidden"
                      pointerEvents="none"
                    >
                      <LuStar
                        size={size}
                        color="var(--chakra-colors-teal-500)"
                        fill="var(--chakra-colors-teal-500)"
                      />
                    </Box>
                  </>
                ) : (
                  <LuStar
                    size={size}
                    color={fill === 'full' ? 'var(--chakra-colors-teal-500)' : 'var(--chakra-colors-gray-300)'}
                    fill={fill === 'full' ? 'var(--chakra-colors-teal-500)' : 'none'}
                  />
                )}
              </Box>
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
}
