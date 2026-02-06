import { Container, Stack, Box, Heading, Grid } from '@chakra-ui/react';
import { WelcomeCard } from '../components/WelcomeCard';
import { FeedList } from '../components/FeedList';
import { RecentlyAdded } from '../components/RecentlyAdded';

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
      <Container maxW="container.xl" py={8}>
        <Stack gap={6}>
          <WelcomeCard
            isAuthenticated={isAuthenticated}
            userName={user.displayName || user.handle}
            apiUrl={apiUrl}
          />

          <Grid
            templateColumns={{ base: '1fr', lg: '1fr 400px' }}
            gap={6}
            alignItems="start"
          >
            <Box
              p={6}
              bg="bg.card"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="border.card"
            >
              <Heading size="lg" mb={4} fontFamily="heading">
                Recent Activity
              </Heading>
              <FeedList apiUrl={apiUrl} limit={20} />
            </Box>

            <RecentlyAdded apiUrl={apiUrl} />
          </Grid>
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
