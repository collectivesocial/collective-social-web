import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
} from '@chakra-ui/react';
import { EmptyState } from '../components/EmptyState';
import { CreateGroupListModal } from '../components/CreateGroupListModal';

interface GroupAdmin {
  did: string;
  permissions: string[];
  addedAt: string;
}

interface GroupList {
  id: number;
  uri: string;
  rkey: string;
  communityDid: string;
  name: string;
  description: string | null;
  purpose: string | null;
  segmentType: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupListItem {
  id: number;
  uri: string;
  rkey: string;
  communityDid: string;
  listId: number;
  listUri: string;
  title: string;
  creator: string | null;
  mediaItemId: number | null;
  mediaType: string;
  order: number;
  status: string;
  statusUri: string | null;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface GroupDetail {
  community: {
    did: string;
    handle: string;
    pds_host: string;
    display_name: string;
    description?: string;
    guidelines?: string;
    type?: string;
    admins: GroupAdmin[];
    created_at: string;
  };
  is_member: boolean;
  is_admin: boolean;
  member_count: number;
  permissions: Record<string, CollectionPermission>;
  lists: GroupList[];
  in_progress_items: GroupListItem[];
}

interface GroupDetailPageProps {
  apiUrl: string;
  openSocialWebUrl: string;
}

const purposeLabels: Record<string, string> = {
  'book-club': '📚 Book Club',
  watchlist: '🎬 Watchlist',
  playlist: '🎵 Playlist',
  general: '📋 General',
};

const mediaTypeEmoji: Record<string, string> = {
  book: '📖',
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  game: '🎮',
  podcast: '🎙️',
  article: '📰',
  video: '📹',
  course: '🎓',
};

export function GroupDetailPage({ apiUrl, openSocialWebUrl }: GroupDetailPageProps) {
  const { groupDid } = useParams<{ groupDid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);

  const refreshGroup = async () => {
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch (err) {
      console.error('Failed to refresh group:', err);
    }
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid!)}`,
          { credentials: 'include' }
        );

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Group not found');
          }
          throw new Error('Failed to load group details');
        }

        const data = await res.json();
        setGroup(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (groupDid) {
      fetchGroupDetails();
    }
  }, [apiUrl, groupDid]);

  const handleJoin = () => {
    const returnTo = encodeURIComponent(window.location.href);
    const joinUrl = `${openSocialWebUrl}/communities/${encodeURIComponent(groupDid!)}?action=join&return_to=${returnTo}`;
    window.location.href = joinUrl;
  };

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.solid" />
            <Text color="fg.muted">Loading group details...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error || !group) {
    return (
      <Container maxW="4xl" py={8}>
        <EmptyState
          icon="😕"
          title={error || 'Group not found'}
          description="This group may not exist or may have been removed."
        />
        <Center mt={6}>
          <Button variant="outline" onClick={() => navigate('/groups')}>
            ← Back to Groups
          </Button>
        </Center>
      </Container>
    );
  }

  const { community } = group;
  const displayName = community.display_name || community.handle;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() => navigate('/groups')}
          color="fg.muted"
          _hover={{ color: 'fg.default' }}
        >
          ← All Groups
        </Button>

        {/* Group Header */}
        <Box
          bg="bg.card"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.card"
          p={6}
        >
          <Flex
            justify="space-between"
            align="start"
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <Box flex="1">
              <HStack gap={3} mb={2} flexWrap="wrap">
                <Heading size="xl" fontFamily="heading">
                  {displayName}
                </Heading>
                {group.is_member && (
                  <Badge colorPalette="green" size="md">
                    Member
                  </Badge>
                )}
                {group.is_admin && (
                  <Badge colorPalette="purple" size="md">
                    Admin
                  </Badge>
                )}
              </HStack>

              <Text fontSize="sm" color="fg.muted" mb={3}>
                @{community.handle}
              </Text>

              {community.description && (
                <Text fontSize="md" color="fg.default" mb={4}>
                  {community.description}
                </Text>
              )}

              <HStack gap={4} flexWrap="wrap">
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight="bold">
                    {group.member_count}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {group.member_count === 1 ? 'member' : 'members'}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight="bold">
                    {group.lists.length}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {group.lists.length === 1 ? 'list' : 'lists'}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.subtle">
                  Created{' '}
                  {new Date(community.created_at).toLocaleDateString()}
                </Text>
              </HStack>
            </Box>

            {/* Join / Membership actions */}
            <VStack gap={2} align="stretch">
              {group.permissions?.['app.collectivesocial.group.list']?.canCreate ? (
                <Button
                  colorPalette="accent"
                  variant="solid"
                  size="md"
                  onClick={() => setShowCreateList(true)}
                >
                  + Create a List
                </Button>
              ) : !group.is_member && (community.type === 'open' || !community.type) ? (
                <Button
                  colorPalette="accent"
                  variant="solid"
                  size="md"
                  onClick={handleJoin}
                >
                  Join Group
                </Button>
              ) : null}
            </VStack>
          </Flex>

          {community.guidelines && (
            <Box
              mt={4}
              pt={4}
              borderTopWidth="1px"
              borderColor="border.card"
            >
              <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb={1}>
                Community Guidelines
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {community.guidelines}
              </Text>
            </Box>
          )}
        </Box>

        {/* Currently Reading / In Progress Section */}
        {group.in_progress_items.length > 0 && (
          <Box>
            <Heading size="md" fontFamily="heading" mb={4}>
              📖 Currently In Progress
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {group.in_progress_items.map((item) => (
                <Box
                  key={item.id}
                  bg="bg.card"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border.card"
                  p={4}
                  cursor={item.mediaItemId ? 'pointer' : 'default'}
                  transition="all 0.2s"
                  _hover={
                    item.mediaItemId
                      ? { shadow: 'sm', transform: 'translateY(-1px)' }
                      : {}
                  }
                  onClick={() => {
                    if (item.mediaItemId) {
                      navigate(`/items/${item.mediaItemId}`);
                    }
                  }}
                >
                  <HStack gap={3}>
                    <Text fontSize="2xl">
                      {mediaTypeEmoji[item.mediaType] || '📄'}
                    </Text>
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm">
                        {item.title}
                      </Text>
                      {item.creator && (
                        <Text fontSize="xs" color="fg.muted">
                          by {item.creator}
                        </Text>
                      )}
                    </Box>
                    <Badge colorPalette="blue" size="sm">
                      In Progress
                    </Badge>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Group Lists Section */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontFamily="heading">
              📋 Group Lists
            </Heading>
            {group.permissions?.['app.collectivesocial.group.list']?.canCreate && (
              <Button
                size="sm"
                colorPalette="accent"
                variant="outline"
                onClick={() => setShowCreateList(true)}
              >
                + New List
              </Button>
            )}
          </Flex>
          {group.lists.length > 0 ? (
            <VStack gap={3} align="stretch">
              {group.lists.map((list) => (
                <Box
                  key={list.id}
                  bg="bg.card"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border.card"
                  p={4}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}
                  onClick={() => navigate(`/groups/${encodeURIComponent(community.did)}/lists/${encodeURIComponent(list.rkey)}`)}
                >
                  <Flex justify="space-between" align="start">
                    <Box flex="1">
                      <HStack gap={2} mb={1}>
                        <Text fontWeight="semibold">{list.name}</Text>
                        {list.purpose && (
                          <Badge variant="subtle" size="sm">
                            {purposeLabels[list.purpose] || list.purpose}
                          </Badge>
                        )}
                        {list.segmentType && (
                          <Badge
                            variant="outline"
                            size="sm"
                            colorPalette="blue"
                          >
                            Tracks {list.segmentType}
                          </Badge>
                        )}
                      </HStack>
                      {list.description && (
                        <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                          {list.description}
                        </Text>
                      )}
                    </Box>
                    <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
                      {new Date(list.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : (
            <EmptyState
              icon="📋"
              title="No lists yet"
              description={
                group.permissions?.['app.collectivesocial.group.list']?.canCreate
                  ? "This group doesn't have any lists yet. Be the first to create one!"
                  : "This group doesn't have any lists yet."
              }
            />
          )}
        </Box>
      </VStack>

      {group.permissions?.['app.collectivesocial.group.list']?.canCreate && (
        <CreateGroupListModal
          isOpen={showCreateList}
          onClose={() => setShowCreateList(false)}
          onCreated={refreshGroup}
          apiUrl={apiUrl}
          communityDid={community.did}
        />
      )}
    </Container>
  );
}
