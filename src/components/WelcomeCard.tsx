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
        bg="bg.subtle"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="border"
      >
        <Heading size="lg">Welcome back, {userName}!</Heading>
      </Box>
    );
  }

  return (
    <Box
      p={8}
      bg="bg.subtle"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border"
    >
      <VStack gap={4} align="center">
        <Heading size="xl">Welcome to Collective</Heading>
        <Text color="fg.muted" fontSize="lg">
          Please log in to continue
        </Text>
        <LoginButton apiUrl={apiUrl} />
      </VStack>
    </Box>
  );
}
