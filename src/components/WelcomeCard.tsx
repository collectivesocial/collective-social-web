import { Box, Heading, Text, VStack } from '@chakra-ui/react';
import { LoginButton } from './LoginButton';

interface WelcomeCardProps {
  isAuthenticated: boolean;
  userName?: string;
  apiUrl: string;
}

export function WelcomeCard({ isAuthenticated, userName, apiUrl }: WelcomeCardProps) {
  if (isAuthenticated && userName) {
    return (
      <Box
        p={6}
        bg="bg.card"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="border.card"
      >
        <Heading size="lg" fontFamily="heading">
          Welcome back, <Text as="span" color="accent.default">{userName}</Text>
        </Heading>
      </Box>
    );
  }

  return (
    <Box
      py={{ base: 12, md: 16 }}
      px={8}
      bg="bg.card"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.card"
      textAlign="center"
    >
      <VStack gap={5} align="center">
        <Heading size="2xl" fontFamily="heading" letterSpacing="-0.02em">
          Welcome to{' '}
          <Text as="span" color="accent.default">Collective</Text>
        </Heading>
        <Text color="fg.muted" fontSize="lg" maxW="md" lineHeight="1.7">
          Track what you read, watch, and listen to — share reviews and discover new favorites together.
        </Text>
        <Box pt={2}>
          <LoginButton apiUrl={apiUrl} />
        </Box>
      </VStack>
    </Box>
  );
}
