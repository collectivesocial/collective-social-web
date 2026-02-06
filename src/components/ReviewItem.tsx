import { useState } from 'react';
import { Box, Flex, Text, HStack, Button } from '@chakra-ui/react';
import { LuMessageSquare, LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './ui/avatar';
import { StarRating } from './StarRating';
import { CommentList } from './CommentList';
import { Reactions } from './Reactions';
import { ShareReviewButton } from './ShareReviewButton';

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
      bg="bg.card"
      borderWidth="1px"
      borderColor="border.card"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      transition="all 0.2s ease"
      _hover={{ shadow: 'sm' }}
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
              <Text fontWeight="bold" fontFamily="heading" _hover={{ color: 'accent.default' }}>
                {review.authorDisplayName}
              </Text>
              <Text color="fg.muted" fontSize="sm" _hover={{ color: 'accent.default' }}>
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
          <Text lineHeight="1.7" fontSize="sm" whiteSpace="pre-wrap" textAlign="left" color="fg.default">
            {review.review}
          </Text>
        </Box>
      </Flex>

      {review.reviewUri && (
        <Box mt={4}>
          <HStack gap={2} wrap="wrap">
            <Button
              size="xs"
              variant="ghost"
              bg="transparent"
              colorPalette="accent"
              onClick={() => setShowComments(!showComments)}
              title={showComments ? 'Hide Comments' : 'View Comments'}
            >
              {showComments ? <LuChevronUp /> : <LuChevronDown />}
            </Button>

            {currentUserDid && (
              <Button
                size="xs"
                colorPalette="accent"
                bg="transparent"
                variant="outline"
                onClick={handleAddComment}
                title="Add Comment"
              >
                <LuMessageSquare /> Comment
              </Button>
            )}

            <ShareReviewButton
              apiUrl={apiUrl}
              reviewId={review.id}
              size="xs"
              variant="ghost"
            />

            <Reactions
              subjectUri={review.reviewUri}
              subjectType="review"
              apiUrl={apiUrl}
              currentUserDid={currentUserDid}
            />
          </HStack>

          {showComments && (
            <Box mt={6} pt={6} borderTop="1px solid" borderColor="border.subtle">
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
