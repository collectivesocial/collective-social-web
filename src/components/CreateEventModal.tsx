/**
 * Re-export shim for tests. Maps the test-contract props to the real component props.
 * Tests import CreateEventModal from this flat path with communityDid/onSuccess props.
 */
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Portal,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { Field } from './ui/field';

interface CreateEventModalProps {
  communityDid: string;
  apiUrl: string;
  onSuccess: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function CreateEventModal({
  communityDid,
  apiUrl,
  onSuccess,
  isOpen = true,
  onClose,
}: CreateEventModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'in_person' | 'virtual'>('in_person');
  const [location, setLocation] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [showEndTime, setShowEndTime] = useState(false);
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName('');
    setDescription('');
    setMode('in_person');
    setLocation('');
    setJoinLink('');
    setStartsAt('');
    setShowEndTime(false);
    setEndsAt('');
    setError(null);
    onClose?.();
  };

  const validateUrl = (url: string): boolean => {
    try { new URL(url); return true; } catch { return false; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Event name is required.');
      return;
    }
    if (!startsAt) {
      setError('Start time is required.');
      return;
    }
    if (mode === 'virtual' && joinLink && !validateUrl(joinLink)) {
      setError('Join link must be a valid URL.');
      return;
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        startsAt: new Date(startsAt).toISOString(),
        mode,
      };
      if (description.trim()) body.description = description.trim();
      if (showEndTime && endsAt) body.endsAt = new Date(endsAt).toISOString();
      if (mode === 'in_person' && location.trim()) body.location = location.trim();
      if (mode === 'virtual' && joinLink.trim()) body.location = joinLink.trim();

      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(communityDid)}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Failed to create event');
      }

      setName('');
      setDescription('');
      setMode('in_person');
      setLocation('');
      setJoinLink('');
      setStartsAt('');
      setShowEndTime(false);
      setEndsAt('');
      setError(null);
      onSuccess();
      onClose?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.700"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        onClick={handleClose}
        overflow="auto"
        py={8}
      >
        <Box
          bg="bg"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="xl"
          p={6}
          maxW="560px"
          w="full"
          mx={4}
          onClick={(e) => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg" fontFamily="heading">
              Schedule an Event
            </Heading>

            {error && (
              <Box bg="red.subtle" color="red.fg" p={3} borderRadius="md" fontSize="sm" role="alert">
                {error}
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <Field label="Title" required>
                  <Input
                    aria-label="Title"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., May Book Club Meetup"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's happening at this event?"
                    rows={3}
                  />
                </Field>

                <Field label="Format">
                  <Flex
                    borderWidth="1px"
                    borderColor="border.card"
                    borderRadius="md"
                    overflow="hidden"
                    alignSelf="flex-start"
                    role="group"
                    aria-label="Format"
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      borderRadius="none"
                      borderRightWidth="1px"
                      borderRightColor="border.card"
                      bg={mode === 'in_person' ? 'teal.subtle' : 'transparent'}
                      color={mode === 'in_person' ? 'teal.fg' : 'fg.default'}
                      fontWeight={mode === 'in_person' ? 'semibold' : 'normal'}
                      _hover={{ bg: mode === 'in_person' ? 'teal.subtle' : 'bg.subtle' }}
                      onClick={() => setMode('in_person')}
                      px={5}
                    >
                      In Person
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      borderRadius="none"
                      bg={mode === 'virtual' ? 'teal.subtle' : 'transparent'}
                      color={mode === 'virtual' ? 'teal.fg' : 'fg.default'}
                      fontWeight={mode === 'virtual' ? 'semibold' : 'normal'}
                      _hover={{ bg: mode === 'virtual' ? 'teal.subtle' : 'bg.subtle' }}
                      onClick={() => setMode('virtual')}
                      px={5}
                    >
                      Online
                    </Button>
                  </Flex>
                </Field>

                {mode === 'in_person' && (
                  <Field label="Location">
                    <Input
                      aria-label="Location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Central Library, Room 2B"
                    />
                  </Field>
                )}

                {mode === 'virtual' && (
                  <Field label="Meeting Link">
                    <Input
                      type="url"
                      aria-label="Meeting Link"
                      value={joinLink}
                      onChange={(e) => setJoinLink(e.target.value)}
                      placeholder="https://meet.example.com/..."
                    />
                  </Field>
                )}

                <Field label="Starts At" required>
                  <Input
                    as="input"
                    type="datetime-local"
                    aria-label="Starts At"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    required
                  />
                </Field>

                {!showEndTime ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    alignSelf="flex-start"
                    color="fg.muted"
                    onClick={() => setShowEndTime(true)}
                  >
                    + Add end time
                  </Button>
                ) : (
                  <Field label="Ends At">
                    <Input
                      as="input"
                      type="datetime-local"
                      value={endsAt}
                      onChange={(e) => setEndsAt(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      color="fg.subtle"
                      mt={1}
                      onClick={() => { setShowEndTime(false); setEndsAt(''); }}
                    >
                      Remove end time
                    </Button>
                  </Field>
                )}

                {/* TODO: attendee limit disclosure */}

                <Flex justify="flex-end" gap={3} pt={2}>
                  <Button
                    type="button"
                    variant="outline"
                    bg="transparent"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorPalette="accent"
                    bg="accent.solid"
                    disabled={submitting || !name.trim() || !startsAt}
                  >
                    {submitting ? 'Scheduling...' : 'Save Event'}
                  </Button>
                </Flex>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Box>
    </Portal>
  );
}
