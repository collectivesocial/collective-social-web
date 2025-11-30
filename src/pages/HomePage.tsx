import { Container, Stack, Box, Heading } from '@chakra-ui/react';
import { WelcomeCard } from '../components/WelcomeCard';
import { FeedList } from '../components/FeedList';

interface HomePageProps {
  isAuthenticated: boolean;
  user: {
    displayName?: string;
    handle: string;
  } | null;
  apiUrl: string;
}

export function HomePage({ isAuthenticated, user, apiUrl }: HomePageProps) {
  if (isAuthenticated && user) {
    return (
      <Container maxW="container.md" py={8}>
        <Stack gap={6}>
          <WelcomeCard
            isAuthenticated={isAuthenticated}
            userName={user.displayName || user.handle}
            apiUrl={apiUrl}
          />

          <Box
            p={6}
            bg="bg.subtle"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="border"
          >
            <Heading size="lg" mb={4}>
              Recent Activity
            </Heading>
            <FeedList apiUrl={apiUrl} limit={20} />
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={20}>
      <WelcomeCard
        isAuthenticated={isAuthenticated}
        apiUrl={apiUrl}
      />
    </Container>
  );
}
