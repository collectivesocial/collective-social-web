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
} from '@chakra-ui/react';
import { EmptyState } from './EmptyState';
import { FollowButton } from './FollowButton';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
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

interface UserProfileViewProps {
  apiUrl: string;
  user: UserProfile;
  collections: Collection[];
  isOwnProfile?: boolean;
  showFollowButton?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function UserProfileView({
  apiUrl,
  user,
  collections,
  isOwnProfile = false,
  showFollowButton = false,
  isFollowing = false,
  onFollowChange,
}: UserProfileViewProps) {
  const navigate = useNavigate();

  return (
    <Container maxW="container.md" py={{ base: 4, md: 8 }}>
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
              borderColor="teal.500"
            >
              <Avatar.Image src={user.avatar} />
              <Avatar.Fallback bg="teal.500" color="white" fontSize="3xl" fontWeight="bold">
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
                <ChakraLink
                  href={`https://bsky.app/profile/${user.did}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="fg.muted"
                  fontSize={{ base: 'md', md: 'lg' }}
                  _hover={{ color: 'teal.500', textDecoration: 'underline' }}
                >
                  @{user.handle}
                </ChakraLink>
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
                {user.description}
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
                  bg="bg.muted"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="md"
                  p={5}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: 'teal.500',
                    shadow: 'md',
                  }}
                  onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
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
