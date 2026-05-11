import { useState } from 'react';
import { Box, Button, Heading, Input, Text, VStack } from '@chakra-ui/react';
import { Field } from './ui/field';
import { peekPostLoginRedirectReason } from '../utils/authRedirect';

interface LoginButtonProps {
  apiUrl: string;
}

export function LoginButton({ apiUrl }: LoginButtonProps) {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // If the visitor was bounced here from a protected page, surface the
  // reason so they understand why they're being asked to sign in.
  const redirectReason = peekPostLoginRedirectReason();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Create a form to submit to the API
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${apiUrl}/login`;

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'input';
      input.value = handle;

      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="400px" mx="auto">
      <form onSubmit={handleLogin}>
        <VStack gap={4} align="stretch">
          <Heading size="lg" fontFamily="heading">
            Login with ATProto
          </Heading>
          {redirectReason && (
            <Box
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Text fontSize="sm" color="fg.muted">
                {redirectReason}
              </Text>
            </Box>
          )}
          <Field label="Handle or DID">
            <Input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="Enter your handle or DID"
              disabled={isLoading}
              required
            />
          </Field>
          <Button
            type="submit"
            colorPalette="accent"
            disabled={isLoading || !handle}
            size="lg"
            cursor={isLoading ? 'wait' : 'pointer'}
          >
            {isLoading ? 'Redirecting...' : 'Login with ATProto'}
          </Button>
          {error && (
            <Text color="fg.error" fontSize="sm">
              {error}
            </Text>
          )}
        </VStack>
      </form>
    </Box>
  );
}
