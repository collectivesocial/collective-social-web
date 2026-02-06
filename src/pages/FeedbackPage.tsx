import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Textarea,
  VStack,
  Input,
  Button,
  Link,
} from '@chakra-ui/react';
import { Field } from '../components/ui/field';

export function FeedbackPage() {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiUrl = 'http://127.0.0.1:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setMessage('');
      setEmail('');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={{ base: 6, md: 10 }}>
      <VStack gap={6} align="stretch">
        <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading">
          Provide Feedback
        </Heading>

        {/* Feedback Form Card */}
        <Box
          bg="bg.card"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="xl"
          p={{ base: 5, md: 8 }}
        >
          <Text color="fg.muted" mb={6}>
            We'd love to hear your thoughts, suggestions, and feedback about Collective Social!
          </Text>

          {submitted && (
            <Box
              bg="green.500/15"
              borderWidth="1px"
              borderColor="green.500/30"
              color="green.400"
              p={4}
              borderRadius="lg"
              mb={6}
            >
              Thank you for your feedback! We'll review it shortly.
            </Box>
          )}

          {error && (
            <Box
              bg="red.500/10"
              borderWidth="1px"
              borderColor="red.500/30"
              color="fg.error"
              p={4}
              borderRadius="lg"
              mb={6}
            >
              {error}
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <VStack gap={5} align="stretch">
              <Field label="Your Feedback *">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                  placeholder="Tell us what you think..."
                />
              </Field>

              <Field
                label="Email (optional)"
              >
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
                <Text fontSize="xs" color="fg.subtle" mt={1}>
                  Optional: Provide your email if you'd like us to follow up
                </Text>
              </Field>

              <Button
                type="submit"
                colorPalette="accent"
                loading={submitting}
                loadingText="Submitting..."
                size="lg"
                alignSelf="flex-start"
              >
                Submit Feedback
              </Button>
            </VStack>
          </form>
        </Box>

        {/* Alternative Contact Card */}
        <Box
          bg="bg.card"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="xl"
          p={{ base: 5, md: 8 }}
        >
          <Text color="fg.muted" mb={6}>
            Other ways to reach us:
          </Text>

          <VStack align="stretch" gap={5}>
            <Heading size="lg" fontFamily="heading" mb={2}>
              Ways to Provide Feedback:
            </Heading>

            <Box>
              <Heading size="sm" fontFamily="heading" color="accent.default" mb={2}>
                GitHub Issues
              </Heading>
              <Text color="fg.muted" fontSize="sm" mb={2}>
                Report bugs or request features on our GitHub repository:
              </Text>
              <Link
                href="https://github.com/collectivesocial/collective-social-web/issues"
                target="_blank"
                rel="noopener noreferrer"
                color="accent.default"
                fontSize="sm"
                _hover={{ color: 'accent.hover' }}
              >
                Open an Issue →
              </Link>
            </Box>

            <Box>
              <Heading size="sm" fontFamily="heading" color="accent.default" mb={2}>
                Bluesky
              </Heading>
              <Text color="fg.muted" fontSize="sm" mb={2}>
                Share your thoughts on Bluesky and tag us:
              </Text>
              <Link
                href="https://bsky.app/profile/collectivesocial.app"
                target="_blank"
                rel="noopener noreferrer"
                color="accent.default"
                fontSize="sm"
                _hover={{ color: 'accent.hover' }}
              >
                @collectivesocial.app
              </Link>
            </Box>
          </VStack>

          <Box
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="lg"
            p={4}
            mt={6}
          >
            <Text color="fg.muted" fontSize="sm">
              💡 <strong>Tip:</strong> When reporting issues, please include as much detail as possible
              about what you were doing when the issue occurred.
            </Text>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
}
