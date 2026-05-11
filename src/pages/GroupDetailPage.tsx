import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatRelativeTime } from '../utils/time';
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
  Tabs,
} from '@chakra-ui/react';
import { Avatar } from '../components/ui/avatar';
import { EmptyState } from '../components/EmptyState';
import { CreateGroupListModal } from '../components/CreateGroupListModal';
import { GroupListsList } from '../components/GroupListsList';
import { EventList } from '../components/events/EventList';
import { CreateEventModal } from '../components/events/CreateEventModal';
import { ShareGroupButton } from '../components/ShareGroupButton';
import { toaster } from '../components/ui/toaster';
import { setPostLoginRedirect, consumePendingGroupJoin } from '../utils/authRedirect';
import type { GroupEvent } from '../types/events';

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
  /** Admin-set sort position; lower numbers appear first. */
  order?: number;
  /** Number of items currently in this list. */
  item_count?: number;
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
    avatar?: string | null;
    banner?: string | null;
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
  isAuthenticated: boolean;
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

export function GroupDetailPage({ apiUrl, isAuthenticated }: GroupDetailPageProps) {
  const { groupDid } = useParams<{ groupDid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [joining, setJoining] = useState(false);

  /**
   * If the user clicks a list or in-progress item while logged out, send
   * them through the login flow and remember to drop them back here. Once
   * they're signed in we'll prompt them to join the group so they can
   * actually view the lists.
   *
   * Returns true when the click was intercepted (caller should bail).
   */
  const interceptIfLoggedOut = (reason: string): boolean => {
    if (isAuthenticated || !groupDid) return false;
    setPostLoginRedirect(`/groups/${encodeURIComponent(groupDid)}`, {
      reason,
      joinGroupDid: groupDid,
    });
    toaster.create({
      title: 'Sign in to continue',
      description: 'Join this group to view its lists.',
      type: 'info',
      duration: 3500,
    });
    navigate('/');
    return true;
  };

  const refreshGroup = async () => {
    try {
      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid!)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch (err) {
      console.error('Failed to refresh group:', err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid!)}/events`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events ?? []);
      }
    } catch {
      // non-fatal — events tab will show empty state
    } finally {
      setEventsLoaded(true);
    }
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid!)}`, {
          credentials: 'include',
        });

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
      fetchEvents();
    }
  }, [apiUrl, groupDid]);

  // After bouncing through login, the group page is the destination. If the
  // user was sent here specifically to join this group, surface a one-time
  // prompt so they understand what to do next.
  useEffect(() => {
    if (!isAuthenticated || !groupDid || !group) return;
    if (!consumePendingGroupJoin(groupDid)) return;
    if (group.is_member) return;
    toaster.create({
      title: 'You\u2019re signed in!',
      description: 'Join this group to view its lists and discussions.',
      type: 'info',
      duration: 6000,
    });
  }, [isAuthenticated, groupDid, group]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid!)}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Surface a clearer prompt for unauthenticated visitors (e.g. someone
        // arriving via a shared link). Other failures are toasted so the page
        // itself stays intact.
        if (res.status === 401) {
          toaster.create({
            title: 'Sign in to join',
            description: 'Sign in with Bluesky to join this group.',
            type: 'info',
            duration: 4000,
          });
          return;
        }
        throw new Error(data.error || 'Failed to join group');
      }
      await refreshGroup();
      toaster.create({
        title: 'Joined!',
        description: 'You\u2019re now a member of this group.',
        type: 'success',
        duration: 2500,
      });
    } catch (err: any) {
      console.error('Failed to join group:', err);
      toaster.create({
        title: 'Couldn\u2019t join group',
        description: err.message || 'Please try again.',
        type: 'error',
        duration: 4000,
      });
    } finally {
      setJoining(false);
    }
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
        {/* Group Header */}
        <Box bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card" p={6}>
          <Flex
            justify="space-between"
            align="start"
            direction={{ base: 'column', md: 'row' }}
            gap={4}
          >
            <HStack gap={4} align="start" flex="1" minW={0}>
              <Avatar
                src={community.avatar || undefined}
                name={displayName}
                size="xl"
                flexShrink={0}
              />
              <Box flex="1" minW={0}>
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
                    Created {formatRelativeTime(community.created_at) || 'recently'}
                  </Text>
                </HStack>
              </Box>
            </HStack>

            {/* Join / Share actions. List creation lives under the Lists tab
                so the header stays focused on identity + membership.
                On mobile this stack centers under the avatar/title block so
                the Share button is visually anchored to the middle of the
                card; on desktop it floats to the right as before. */}
            <VStack
              gap={2}
              align={{ base: 'center', md: 'stretch' }}
              width={{ base: '100%', md: 'auto' }}
            >
              {!group.is_member && (community.type === 'open' || !community.type) && (
                <Button
                  colorPalette="accent"
                  variant="solid"
                  size="md"
                  onClick={handleJoin}
                  disabled={joining}
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </Button>
              )}
              <ShareGroupButton
                apiUrl={apiUrl}
                groupDid={community.did}
                groupName={displayName}
                size="md"
                variant="outline"
              />
            </VStack>
          </Flex>

          {community.guidelines && (
            <Box mt={4} pt={4} borderTopWidth="1px" borderColor="border.card">
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
            <VStack gap={4} align="stretch">
              {group.in_progress_items.map(item => (
                <Box
                  key={item.id}
                  bg="bg.card"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border.card"
                  p={4}
                  cursor={item.rkey && item.listUri ? 'pointer' : 'default'}
                  transition="all 0.2s"
                  _hover={
                    item.rkey && item.listUri ? { shadow: 'sm', transform: 'translateY(-1px)' } : {}
                  }
                  onClick={() => {
                    if (!item.rkey || !item.listUri) return;
                    if (interceptIfLoggedOut('Sign in to view what this group is reading.')) return;
                    const lRkey = item.listUri.split('/').pop() || '';
                    navigate(
                      `/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(lRkey)}/items/${encodeURIComponent(item.rkey)}`
                    );
                  }}
                >
                  <HStack gap={3}>
                    <Text fontSize="2xl">{mediaTypeEmoji[item.mediaType] || '📄'}</Text>
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
            </VStack>
          </Box>
        )}

        {/* Tabs: Lists + Events */}
        <Tabs.Root defaultValue="lists" variant="enclosed">
          <Tabs.List mb={4} justifyContent="flex-start">
            <Tabs.Trigger value="lists" bg="transparent">
              📋 Lists
            </Tabs.Trigger>
            <Tabs.Trigger value="events" bg="transparent">
              📅 Events
            </Tabs.Trigger>
          </Tabs.List>

          {/* Lists Tab */}
          <Tabs.Content value="lists">
            <Box>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md" fontFamily="heading">
                  Group Lists
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
                <GroupListsList
                  lists={group.lists}
                  communityDid={community.did}
                  apiUrl={apiUrl}
                  canReorder={group.is_admin}
                  purposeLabels={purposeLabels}
                  isAuthenticated={isAuthenticated}
                />
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
          </Tabs.Content>

          {/* Events Tab */}
          <Tabs.Content value="events">
            {eventsLoaded ? (
              <EventList
                events={events}
                groupDid={groupDid!}
                canCreate={
                  group.permissions?.['community.lexicon.calendar.event']?.canCreate === true
                }
                onCreateClick={() => setShowCreateEvent(true)}
              />
            ) : (
              <Center py={8}>
                <Spinner size="md" color="accent.solid" />
              </Center>
            )}
          </Tabs.Content>
        </Tabs.Root>
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

      <CreateEventModal
        groupDid={community.did}
        isOpen={showCreateEvent}
        onClose={() => setShowCreateEvent(false)}
        onCreated={fetchEvents}
        apiUrl={apiUrl}
      />
    </Container>
  );
}
