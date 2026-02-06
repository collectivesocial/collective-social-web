import { useEffect, useState } from 'react';
import { Box, Button, Flex, Text, Spinner } from '@chakra-ui/react';
import { Avatar } from './ui/avatar';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface AuthenticatedUserProps {
  apiUrl?: string;
}

export function AuthenticatedUser({ apiUrl = 'http://127.0.0.1:3000' }: AuthenticatedUserProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/users/me`, {
      credentials: 'include', // Important: send cookies
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, [apiUrl]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return <Spinner size="sm" />;
  }

  if (!user) {
    return null;
  }

  return (
    <Flex
      align="center"
      gap={4}
      p={4}
      borderWidth="1px"
      borderColor="border.card"
      borderRadius="xl"
      maxW="400px"
      mx="auto"
      bg="bg.card"
    >
      <Avatar
        src={user.avatar}
        name={user.displayName || user.handle}
        size="md"
      />
      <Box flex={1} textAlign="left">
        <Text fontWeight="bold">
          {user.displayName || user.handle}
        </Text>
        <Text color="fg.muted" fontSize="sm">
          @{user.handle}
        </Text>
      </Box>
      <Button
        onClick={handleLogout}
        colorPalette="red"
        size="sm"
      >
        Logout
      </Button>
    </Flex>
  );
}
