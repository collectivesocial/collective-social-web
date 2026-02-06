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
} from '@chakra-ui/react';
import { EmptyState } from '../components/EmptyState';

interface Community {
  did: string;
  handle: string;
  pds_host: string;
  created_at: string;
  is_admin: boolean;
  display_name: string | null;
  description: string | null;
}

function GroupCard({
  community,
  onJoined,
}: {
  community: Community;
  onJoined: () => void;
}) {
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response = await fetch(
        `/groups/${encodeURIComponent(community.did)}/join`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (response.ok) {
        onJoined();
      }
    } catch (err) {
      console.error('Failed to join:', err);
    } finally {
      setJoining(false);
    }
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
      transition="all 0.2s"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
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
        {community.is_admin && (
          <Badge colorPalette="purple" size="sm">
            Admin
          </Badge>
        )}
      </Flex>

      {description && (
        <Text fontSize="sm" color="fg.muted" mb={3} lineClamp={3}>
          {description}
        </Text>
      )}

      <Text fontSize="xs" color="fg.subtle" mb={3}>
        Created {new Date(community.created_at).toLocaleDateString()}
      </Text>

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
    </Box>
  );
}

interface GroupsPageProps {
  apiUrl: string;
}

export function GroupsPage({ apiUrl }: GroupsPageProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/groups', {
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
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

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

        {loading ? (
          <Center py={12}>
            <Spinner size="xl" />
          </Center>
        ) : communities.length === 0 ? (
          <EmptyState
            icon="🏘️"
            title="No groups yet"
            description="There are no communities available right now. Check back later!"
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
                onJoined={fetchCommunities}
              />
            ))}
          </Grid>
        )}
      </VStack>
    </Container>
  );
}
