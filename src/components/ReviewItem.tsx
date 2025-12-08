import { useState } from 'react';
import { Box, Flex, Text, HStack, Button } from '@chakra-ui/react';
import { LuMessageSquare } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './ui/avatar';
import { StarRating } from './StarRating';
import { CommentList } from './CommentList';

interface Review {
  id: number;
  authorDid: string;
  authorHandle: string;
  authorDisplayName: string;
  authorAvatar: string | null;
  rating: number;
  review: string;
  reviewUri: string | null;
  listItemUri: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewItemProps {
  review: Review;
  apiUrl: string;
  currentUserDid: string | null;
  formatDate: (dateString: string) => string;
}

export function ReviewItem({
  review,
  apiUrl,
  currentUserDid,
  formatDate,
}: ReviewItemProps) {
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleAddComment = () => {
    if (!showComments) {
      setShowComments(true);
    }
    setShowCommentForm(true);
  };

  return (
    <Box
      bg="bg.muted"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <Flex gap={4} mb={4} direction={{ base: 'column', sm: 'row' }}>
        <Avatar
          size="lg"
          name={review.authorDisplayName}
          src={review.authorAvatar || undefined}
          fallback="👤"
          bg="transparent"
          flexShrink={0}
        />

        <Box flex={1} minW={0}>
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            gap={2}
          >
            <Flex
              align="center"
              gap={2}
              flexWrap="wrap"
              cursor="pointer"
              onClick={() => navigate(`/profile/${review.authorHandle}`)}
            >
              <Text fontWeight="bold" _hover={{ color: 'teal.500' }}>
                {review.authorDisplayName}
              </Text>
              <Text color="fg.muted" fontSize="sm" _hover={{ color: 'teal.500' }}>
                @{review.authorHandle}
              </Text>
              <Text color="fg.muted" fontSize="sm">
                ·
              </Text>
              <Text color="fg.muted" fontSize="sm">
                {formatDate(review.createdAt)}
              </Text>
            </Flex>
            <HStack gap={1} flexShrink={0}>
              <StarRating rating={review.rating} size="1.25rem" />
              <Text color="fg.muted" fontSize="sm">
                {review.rating.toFixed(1)}
              </Text>
            </HStack>
          </Flex>
          <Text lineHeight="1.6" fontSize="sm" whiteSpace="pre-wrap" textAlign="left">
            {review.review}
          </Text>
        </Box>
      </Flex>

      {review.reviewUri && (
        <Box mt={4}>
          <HStack gap={2}>
            <Button
              size="xs"
              variant="ghost"
              bg="transparent"
              colorPalette="teal"
              onClick={() => setShowComments(!showComments)}
            >
              <LuMessageSquare />
              {showComments ? 'Hide Comments' : 'View Comments'}
            </Button>

            {currentUserDid && (
              <Button
                size="xs"
                colorPalette="teal"
                bg="transparent"
                variant="outline"
                onClick={handleAddComment}
              >
                <LuMessageSquare />
                Add Comment
              </Button>
            )}
          </HStack>

          {showComments && (
            <Box mt={6} pt={6} borderTop="1px solid" borderColor="border">
              <CommentList
                reviewUri={review.reviewUri}
                apiUrl={apiUrl}
                currentUserDid={currentUserDid}
                autoFocusForm={showCommentForm}
                onCommentFormClose={() => setShowCommentForm(false)}
              />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
