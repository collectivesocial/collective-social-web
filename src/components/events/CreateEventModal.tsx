import { useState } from 'react';
import { Box, Button, Flex, Heading, Input, Portal, Textarea, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../ui/field';

interface CreateEventModalProps {
  groupDid: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  apiUrl: string;
}

export function CreateEventModal({
  groupDid,
  isOpen,
  onClose,
  onCreated,
  apiUrl,
}: CreateEventModalProps) {
  const navigate = useNavigate();

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setMode('in_person');
    setLocation('');
    setJoinLink('');
    setStartsAt('');
    setShowEndTime(false);
    setEndsAt('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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

      // Persist location/links using the canonical lexicon shape
      // (`community.lexicon.calendar.event`): physical addresses go in
      // `locations[]` and external URLs (join links, signup pages, etc.) go in
      // `uris[]`.
      if (mode === 'in_person' && location.trim()) {
        body.locations = [{ name: location.trim() }];
      }
      if (mode === 'virtual' && joinLink.trim()) {
        body.uris = [{ uri: joinLink.trim(), name: 'Join link' }];
      }

      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid)}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create event');
      }

      const created = await res.json();
      resetForm();
      onCreated();
      onClose();

      if (created.rkey) {
        navigate(
          `/groups/${encodeURIComponent(groupDid)}/events/${encodeURIComponent(created.rkey)}`
        );
      }
    } catch (err: any) {
      setError(err.message);
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
          onClick={e => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg" fontFamily="heading">
              Schedule an Event
            </Heading>

            {error && (
              <Box bg="red.subtle" color="red.fg" p={3} borderRadius="md" fontSize="sm">
                {error}
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <Field label="Event name" required>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g., May Book Club Meetup"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
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
                    role="radiogroup"
                    aria-label="Event format"
                  >
                    {(['in_person', 'virtual'] as const).map((m, i) => (
                      <Button
                        key={m}
                        role="radio"
                        aria-checked={mode === m}
                        type="button"
                        variant="ghost"
                        size="sm"
                        borderRadius="none"
                        borderRightWidth={i === 0 ? '1px' : '0'}
                        borderRightColor="border.card"
                        bg={mode === m ? 'teal.subtle' : 'transparent'}
                        color={mode === m ? 'teal.fg' : 'fg.default'}
                        fontWeight={mode === m ? 'semibold' : 'normal'}
                        _hover={{ bg: mode === m ? 'teal.subtle' : 'bg.subtle' }}
                        onClick={() => setMode(m)}
                        px={5}
                      >
                        {m === 'in_person' ? 'In-person' : 'Virtual'}
                      </Button>
                    ))}
                  </Flex>
                </Field>

                {mode === 'in_person' && (
                  <Field label="Location">
                    <Input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g., Central Library, Room 2B"
                    />
                  </Field>
                )}

                {mode === 'virtual' && (
                  <Field label="Join link">
                    <Input
                      type="url"
                      value={joinLink}
                      onChange={e => setJoinLink(e.target.value)}
                      placeholder="https://meet.example.com/..."
                    />
                  </Field>
                )}

                <Field label="Start time" required>
                  <Input
                    as="input"
                    type="datetime-local"
                    value={startsAt}
                    onChange={e => setStartsAt(e.target.value)}
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
                  <Field label="End time">
                    <Input
                      as="input"
                      type="datetime-local"
                      value={endsAt}
                      onChange={e => setEndsAt(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      color="fg.subtle"
                      mt={1}
                      onClick={() => {
                        setShowEndTime(false);
                        setEndsAt('');
                      }}
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
                    {submitting ? 'Scheduling...' : 'Schedule Event'}
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
