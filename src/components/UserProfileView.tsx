import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  Avatar,
  Link as ChakraLink,
  SimpleGrid,
  Badge,
  Image,
} from '@chakra-ui/react';
import { EmptyState } from './EmptyState';
import { FollowButton } from './FollowButton';
import { ProgressBarDisplay } from './ProgressBarDisplay';
import { renderTextWithLinks } from '../utils/textUtils';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
  followerCount?: number;
  collectionCount?: number;
  reviewCount?: number;
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility: string;
  purpose: string;
  avatar: string | null;
  createdAt: string;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  length: number | null;
  totalRatings: number;
  totalReviews: number;
  totalSaves: number;
  averageRating: number | null;
}

interface InProgressItem {
  uri: string;
  cid: string;
  title: string;
  creator: string | null;
  mediaType: string;
  mediaItemId: number | null;
  status: string;
  rating: number | null;
  review: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  listUri: string;
  mediaItem?: MediaItem;
}

interface UserProfileViewProps {
  apiUrl: string;
  user: UserProfile;
  collections: Collection[];
  inProgressItems: InProgressItem[];
  isOwnProfile?: boolean;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function UserProfileView({
  apiUrl,
  user,
  collections,
  inProgressItems,
  isOwnProfile = false,
  showFollowButton = false,
  isFollowing = false,
  onFollowChange,
}: UserProfileViewProps) {
  const navigate = useNavigate();

  // Check if user is in the database (has used Collective)
  const isInDatabase = (user.collectionCount !== undefined && user.collectionCount > 0) || 
                       (user.reviewCount !== undefined && user.reviewCount > 0) ||
                       collections.length > 0;

  return (
    <Container maxW="container.md" py={{ base: 4 }}>
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        {/* Profile Header */}
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          p={{ base: 4, md: 8 }}
        >
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            align={{ base: 'center', sm: 'flex-start' }}
            gap={{ base: 4, md: 6 }}
            mb={{ base: 4, md: 6 }}
          >
            <Avatar.Root
              size="2xl"
              borderWidth="3px"
              borderColor="accent.500"
            >
              <Avatar.Image src={user.avatar} />
              <Avatar.Fallback bg="accent.500" color="white" fontSize="3xl" fontWeight="bold">
                {(user.displayName || user.handle).charAt(0).toUpperCase()}
              </Avatar.Fallback>
            </Avatar.Root>

            <Flex
              direction={{ base: 'column', sm: 'row' }}
              align={{ base: 'center', sm: 'flex-start' }}
              justify="space-between"
              flex={1}
              gap={{ base: 3, sm: 4 }}
              w="full"
            >
              <VStack
                align={{ base: 'center', sm: 'flex-start' }}
                gap={2}
                textAlign={{ base: 'center', sm: 'left' }}
                flex={1}
              >
                <Heading size={{ base: 'xl', md: '2xl' }}>
                  {user.displayName || user.handle}
                </Heading>
                <Flex gap={2} align="center" flexWrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
                  <ChakraLink
                    href={`https://bsky.app/profile/${user.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="fg.muted"
                    fontSize={{ base: 'md', md: 'lg' }}
                    _hover={{ color: 'accent.500', textDecoration: 'underline' }}
                  >
                    @{user.handle}
                  </ChakraLink>
                  {!isInDatabase && (
                    <Badge colorPalette="gray" size="sm" variant="subtle">
                      Not on Collective yet
                    </Badge>
                  )}
                </Flex>
                <Flex gap={4} fontSize="sm" flexWrap="wrap" justify={{ base: 'center', sm: 'flex-start' }}>
                  <Text color="fg.muted">
                    <Text as="span" fontWeight="bold">{user.followerCount || 0}</Text> {user.followerCount === 1 ? 'follower' : 'followers'}
                  </Text>
                  <Text color="fg.muted">·</Text>
                  <Text color="fg.muted">
                    <Text as="span" fontWeight="bold">{user.collectionCount || 0}</Text> {user.collectionCount === 1 ? 'collection' : 'collections'}
                  </Text>
                  <Text color="fg.muted">·</Text>
                  <Text color="fg.muted">
                    <Text as="span" fontWeight="bold">{user.reviewCount || 0}</Text> {user.reviewCount === 1 ? 'review' : 'reviews'}
                  </Text>
                </Flex>
              </VStack>

              {showFollowButton && !isOwnProfile && (
                <Box flexShrink={0}>
                  <FollowButton
                    apiUrl={apiUrl}
                    userDid={user.did}
                    initialFollowing={isFollowing}
                    onFollowChange={onFollowChange}
                  />
                </Box>
              )}
            </Flex>
          </Flex>

          {user.description ? (
            <Box
              p={{ base: 4, md: 6 }}
              bg="bg.muted"
              borderRadius="md"
              mt={{ base: 4, md: 6 }}
            >
              <Heading size="md" mb={3}>
                Bio
              </Heading>
              <Text
                lineHeight={1.6}
                whiteSpace="pre-wrap"
              >
                {renderTextWithLinks(user.description)}
              </Text>
            </Box>
          ) : (
            <Box
              p={{ base: 4, md: 6 }}
              bg="bg.muted"
              borderRadius="md"
              mt={{ base: 4, md: 6 }}
              textAlign="center"
            >
              <Text color="fg.muted">No bio added yet</Text>
            </Box>
          )}
        </Box>

        {/* In Progress Items */}
        {inProgressItems.length > 0 && (
          <Box
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border"
            borderRadius="lg"
            p={{ base: 4, md: 8 }}
          >
            <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 4, md: 6 }}>
              In Progress
            </Heading>
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
              gap={4}
            >
              {inProgressItems.map((item) => {
                const mediaItem = item.mediaItem;
                const coverImage = mediaItem?.coverImage || null;
                
                return (
                  <Box
                    key={item.uri}
                    as="article"
                    bg="bg.muted"
                    borderWidth="1px"
                    borderColor="border"
                    borderRadius="md"
                    overflow="hidden"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'accent.500',
                      shadow: 'md',
                    }}
                    _focusVisible={{
                      outline: '2px solid',
                      outlineColor: 'accent.500',
                      outlineOffset: '2px',
                    }}
                    onClick={() => {
                      if (mediaItem) {
                        navigate(`/items/${mediaItem.id}`);
                      }
                    }}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && mediaItem) {
                        e.preventDefault();
                        navigate(`/items/${mediaItem.id}`);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${item.title}`}
                  >
                    {/* Cover Image */}
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={item.title}
                        width="100%"
                        height="200px"
                        objectFit="cover"
                        loading="lazy"
                      />
                    ) : (
                      <Box
                        width="100%"
                        height="200px"
                        bg="gray.200"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="gray.500" fontSize="sm">
                          No cover
                        </Text>
                      </Box>
                    )}

                    {/* Item Info */}
                    <Box p={3}>
                      <Heading size="sm" mb={1} lineClamp={2}>
                        {item.title}
                      </Heading>
                      {item.creator && (
                        <Text color="fg.muted" fontSize="sm" mb={2} lineClamp={1}>
                          {item.creator}
                        </Text>
                      )}
                      
                      {/* Progress Bar */}
                      {mediaItem && (
                        <Box mt={2}>
                          <ProgressBarDisplay
                            listItemUri={item.uri}
                            itemLength={mediaItem.length}
                            mediaType={item.mediaType}
                            apiUrl={apiUrl}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* Public Collections */}
        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          p={{ base: 4, md: 8 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 4, md: 6 }}>
            Public Collections
          </Heading>
          {collections.length === 0 ? (
            <EmptyState
              title="No public collections yet"
              description="Public collections will appear here"
            />
          ) : (
            <SimpleGrid
              columns={{ base: 1, sm: 2, md: 3 }}
              gap={4}
            >
              {collections.map((collection) => (
                <Box
                  key={collection.uri}
                  as="article"
                  bg="bg.muted"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  p={5}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: 'accent.500',
                    shadow: 'md',
                  }}
                  _focusVisible={{
                    outline: '2px solid',
                    outlineColor: 'accent.500',
                    outlineOffset: '2px',
                  }}
                  onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/collections/${encodeURIComponent(collection.uri)}`);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View collection: ${collection.name}`}
                >
                  <Heading size="sm" mb={2} lineClamp={1}>
                    {collection.name}
                  </Heading>
                  {collection.description && (
                    <Text
                      color="fg.muted"
                      fontSize="sm"
                      lineClamp={2}
                    >
                      {collection.description}
                    </Text>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </Container>
  );
}
