import { useState, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '../utils/time';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Grid,
  Flex,
  Button,
  Badge,
  Spinner,
  Center,
  HStack,
  Link,
  Input,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/avatar';
import { EmptyState } from '../components/EmptyState';

interface Community {
  did: string;
  handle: string;
  pds_host: string;
  created_at: string;
  is_admin: boolean;
  is_member: boolean;
  display_name: string | null;
  description: string | null;
  avatar?: string | null;
  type?: string;
}

function GroupCard({
  community,
  onJoined,
  apiUrl,
}: {
  community: Community;
  onJoined: () => void;
  apiUrl: string;
}) {
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);

  const handleJoin = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setJoining(true);
    try {
      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(community.did)}/join`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to join group');
      }
      onJoined();
    } catch (err) {
      console.error('Failed to join group:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/groups/${encodeURIComponent(community.did)}`);
  };

  const displayName = community.display_name || community.handle;
  const description = community.description;

  return (
    <Box
      bg="bg.card"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.card"
      p={5}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
      onClick={handleCardClick}
    >
      <Flex justify="space-between" align="start" mb={2} gap={3}>
        <HStack gap={3} align="start" minW={0} flex="1">
          <Avatar src={community.avatar || undefined} name={displayName} size="md" flexShrink={0} />
          <Box minW={0}>
            <Heading size="sm" mb={1} fontFamily="heading" lineClamp={1}>
              {displayName}
            </Heading>
            <Text fontSize="xs" color="fg.muted" lineClamp={1}>
              @{community.handle}
            </Text>
          </Box>
        </HStack>
        <Flex gap={1} flexShrink={0}>
          {community.is_member && (
            <Badge colorPalette="green" size="sm">
              Member
            </Badge>
          )}
          {community.is_admin && (
            <Badge colorPalette="purple" size="sm">
              Admin
            </Badge>
          )}
        </Flex>
      </Flex>

      {description && (
        <Text fontSize="sm" color="fg.muted" mb={3} lineClamp={3}>
          {description}
        </Text>
      )}

      <Text fontSize="xs" color="fg.subtle" mb={3}>
        Created {formatRelativeTime(community.created_at) || 'recently'}
      </Text>

      {community.is_member ? null : community.type === 'open' || !community.type ? (
        <Button
          size="sm"
          colorPalette="accent"
          variant="outline"
          width="full"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? 'Joining...' : 'Join Group'}
        </Button>
      ) : (
        <Badge colorPalette="gray" size="sm" width="full" textAlign="center" py={1}>
          {community.type === 'private' ? 'Invite Only' : 'Approval Required'}
        </Badge>
      )}
    </Box>
  );
}

interface GroupsPageProps {
  apiUrl: string;
}

const PAGE_SIZE = 10;
const SEARCH_LIMIT = 50;

export function GroupsPage({ apiUrl }: GroupsPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // "My Groups" — communities the authenticated user is a member of.
  // Fetched separately and rendered above the discover list/search results.
  const [myGroups, setMyGroups] = useState<Community[]>([]);
  const [myGroupsLoading, setMyGroupsLoading] = useState(true);
  // Communities the user has a membership record for, but which OpenSocial
  // refused to return for Collective Social (typically because Collective
  // Social isn't enabled in the community's Apps settings).
  const [inaccessibleGroups, setInaccessibleGroups] = useState<
    Array<{ did: string; status: number | null; reason: string }>
  >([]);

  const fetchMyGroups = useCallback(async () => {
    setMyGroupsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/groups/mine`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMyGroups(data.communities || []);
        setInaccessibleGroups(data.inaccessibleCommunities || []);
      } else {
        // Likely 401 — user not authenticated. Just hide the section.
        setMyGroups([]);
        setInaccessibleGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch my groups:', error);
      setMyGroups([]);
      setInaccessibleGroups([]);
    } finally {
      setMyGroupsLoading(false);
    }
  }, [apiUrl]);

  const fetchCommunities = useCallback(
    async (opts: { query?: string; cursor?: string; append?: boolean } = {}) => {
      const { query, cursor: pageCursor, append } = opts;
      const searching = !!query && query.length >= 3;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams();
        if (searching) {
          params.set('query', query!);
          params.set('limit', String(SEARCH_LIMIT));
        } else {
          params.set('limit', String(PAGE_SIZE));
        }
        if (pageCursor) params.set('cursor', pageCursor);

        const response = await fetch(`${apiUrl}/groups?${params.toString()}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          const nextItems: Community[] = data.communities || [];
          setCommunities(prev => (append ? [...prev, ...nextItems] : nextItems));
          // When searching, ignore the cursor — we show everything in one list.
          setCursor(searching ? undefined : data.cursor);
        }
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiUrl]
  );

  // Initial load — fetch My Groups and first page of discover list in parallel.
  useEffect(() => {
    fetchMyGroups();
  }, [fetchMyGroups]);

  // Debounced search (min 3 characters). Also handles the "cleared search"
  // case by reloading the first page of the default discover list.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    // If 1-2 chars, do nothing — wait for more input
    if (trimmed.length > 0 && trimmed.length < 3) return;

    const delay = trimmed.length >= 3 ? 400 : 0;
    const timeout = setTimeout(() => {
      fetchCommunities({ query: trimmed || undefined });
    }, delay);

    return () => clearTimeout(timeout);
  }, [searchQuery, fetchCommunities]);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length >= 3;
  // Hide groups the user is already in from the discover list — they're
  // shown above in the "My Groups" section, so listing them twice is just
  // noise. When searching we still show everything so the search reflects
  // real results.
  const discoverCommunities = isSearching ? communities : communities.filter(c => !c.is_member);
  const handleLoadMore = () => {
    if (!cursor || loadingMore) return;
    fetchCommunities({ cursor, append: true });
  };
  const handleJoined = () => {
    // Refresh both lists so the joined community moves into My Groups and the
    // discover list reflects the updated `is_member` flag.
    fetchMyGroups();
    fetchCommunities({ query: isSearching ? trimmedQuery : undefined });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 4, md: 0 }}
        >
          <Box>
            <Heading size={{ base: 'xl', md: '2xl' }} mb={2} fontFamily="heading">
              Groups
            </Heading>
            <Text color="fg.muted">
              Discover and join communities powered by{' '}
              <Link href="https://opensocial.community" target="_blank" rel="noopener noreferrer">
                OpenSocial
              </Link>
            </Text>
          </Box>
        </Flex>

        {/* My Groups — only shown when the authenticated user has joined at least one group */}
        {!myGroupsLoading && myGroups.length > 0 && (
          <Box>
            <Heading size="md" mb={3} fontFamily="heading">
              My Groups
            </Heading>
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={4}
            >
              {myGroups.map(community => (
                <GroupCard
                  key={community.did}
                  community={community}
                  onJoined={handleJoined}
                  apiUrl={apiUrl}
                />
              ))}
            </Grid>
          </Box>
        )}

        {/* Inaccessible groups — communities the user is a member of but
            which haven't enabled Collective Social. */}
        {!myGroupsLoading && inaccessibleGroups.length > 0 && (
          <Box bg="bg.subtle" borderRadius="lg" borderWidth="1px" borderColor="border" p={4}>
            <Heading size="sm" mb={2} fontFamily="heading">
              {inaccessibleGroups.length === 1
                ? 'A community you joined is not accessible here'
                : 'Some communities you joined are not accessible here'}
            </Heading>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              You are a member of{' '}
              {inaccessibleGroups.length === 1 ? 'this community' : 'these communities'}, but it
              hasn&apos;t enabled Collective Social as an app yet. Ask a community admin to enable
              Collective Social in their OpenSocial settings, or visit OpenSocial to manage your
              membership.
            </Text>
            <VStack align="stretch" gap={1}>
              {inaccessibleGroups.map(g => (
                <Flex key={g.did} gap={2} fontSize="sm" align="center" wrap="wrap">
                  <Link
                    href={`https://app.opensocial.community/communities/${encodeURIComponent(g.did)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="teal.fg"
                  >
                    {g.did}
                  </Link>
                  <Text color="fg.muted" fontSize="xs">
                    {g.status ? `(${g.status})` : ''} {g.reason}
                  </Text>
                </Flex>
              ))}
            </VStack>
          </Box>
        )}

        {/* Discover — search + paginated list */}
        <Box>
          <Heading size="md" mb={3} fontFamily="heading">
            {myGroups.length > 0 ? 'Discover more groups' : 'Discover groups'}
          </Heading>
          <Input
            placeholder="Search communities by name or handle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="lg"
          />
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 3 && (
            <Text color="fg.muted" fontSize="sm" mt={1}>
              Type at least 3 characters to search
            </Text>
          )}
        </Box>

        {loading ? (
          <Center py={12}>
            <Spinner size="xl" />
          </Center>
        ) : discoverCommunities.length === 0 ? (
          <EmptyState
            icon="🏘️"
            title={isSearching ? 'No groups found' : 'No groups yet'}
            description={
              isSearching
                ? `No communities found matching "${searchQuery}". Try a different search.`
                : myGroups.length > 0
                  ? 'You\u2019re already a member of every group on this page. Load more to discover others, or try a search above.'
                  : 'There are no communities available right now. Check back later!'
            }
          />
        ) : (
          <>
            <Grid
              templateColumns={{
                base: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              }}
              gap={4}
            >
              {discoverCommunities.map(community => (
                <GroupCard
                  key={community.did}
                  community={community}
                  onJoined={handleJoined}
                  apiUrl={apiUrl}
                />
              ))}
            </Grid>
            {!isSearching && cursor && (
              <Center pt={4}>
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  colorPalette="accent"
                >
                  {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
              </Center>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
}
