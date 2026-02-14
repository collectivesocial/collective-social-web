import { useState, useEffect, useCallback } from 'react';
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
  Link,
  Input,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
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
  type?: string;
}

function GroupCard({
  community,
  openSocialWebUrl,
}: {
  community: Community;
  onJoined: () => void;
  apiUrl: string;
  openSocialWebUrl: string;
}) {
  const navigate = useNavigate();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const returnTo = encodeURIComponent(window.location.href);
    const joinUrl = `${openSocialWebUrl}/communities/${encodeURIComponent(community.did)}?action=join&return_to=${returnTo}`;
    window.location.href = joinUrl;
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
      <Flex justify="space-between" align="start" mb={2}>
        <Box>
          <Heading size="sm" mb={1} fontFamily="heading">
            {displayName}
          </Heading>
          <Text fontSize="xs" color="fg.muted">
            @{community.handle}
          </Text>
        </Box>
        <Flex gap={1}>
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
        Created {new Date(community.created_at).toLocaleDateString()}
      </Text>

      {community.is_member ? (
        <Badge colorPalette="green" size="sm" width="full" textAlign="center" py={1}>
          ✓ Member
        </Badge>
      ) : (community.type === 'open' || !community.type) ? (
        <Button
          size="sm"
          colorPalette="accent"
          variant="outline"
          width="full"
          onClick={handleJoin}
        >
          Join Group
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
  openSocialWebUrl: string;
}

export function GroupsPage({ apiUrl, openSocialWebUrl }: GroupsPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCommunities = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query && query.length >= 3) params.set('query', query);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${apiUrl}/groups${qs}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Initial load
  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  // Debounced search (min 3 characters)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    // If 1-2 chars, do nothing — wait for more input
    if (trimmed.length > 0 && trimmed.length < 3) return;

    const timeout = setTimeout(() => {
      fetchCommunities(trimmed || undefined);
    }, trimmed.length >= 3 ? 400 : 0);

    return () => clearTimeout(timeout);
  }, [searchQuery, fetchCommunities]);

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

        {/* Search */}
        <Box>
          <Input
            placeholder="Search communities by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        ) : communities.length === 0 ? (
          <EmptyState
            icon="🏘️"
            title={searchQuery.trim().length >= 3 ? 'No groups found' : 'No groups yet'}
            description={searchQuery.trim().length >= 3
              ? `No communities found matching "${searchQuery}". Try a different search.`
              : 'There are no communities available right now. Check back later!'
            }
          />
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={4}
          >
            {communities.map((community) => (
              <GroupCard
                key={community.did}
                community={community}
                onJoined={() => fetchCommunities(searchQuery.trim() || undefined)}
                apiUrl={apiUrl}
                openSocialWebUrl={openSocialWebUrl}
              />
            ))}
          </Grid>
        )}
      </VStack>
    </Container>
  );
}
