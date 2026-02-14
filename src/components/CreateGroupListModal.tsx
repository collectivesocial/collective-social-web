import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  Portal,
} from '@chakra-ui/react';
import { Field } from './ui/field';

interface CreateGroupListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  apiUrl: string;
  communityDid: string;
}

const purposes = [
  { value: 'book-club', label: '📚 Book Club' },
  { value: 'watchlist', label: '🎬 Watchlist' },
  { value: 'playlist', label: '🎵 Playlist' },
  { value: 'general', label: '📋 General' },
];

const segmentTypes = [
  { value: '', label: 'None' },
  { value: 'pages', label: 'Pages' },
  { value: 'percent', label: 'Percent' },
  { value: 'chapters', label: 'Chapters' },
];

export function CreateGroupListModal({
  isOpen,
  onClose,
  onCreated,
  apiUrl,
  communityDid,
}: CreateGroupListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('general');
  const [segmentType, setSegmentType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(communityDid)}/lists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name,
            description: description || undefined,
            purpose,
            segmentType: segmentType || undefined,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create list');
      }

      // Reset form and close
      setName('');
      setDescription('');
      setPurpose('general');
      setSegmentType('');
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
        onClick={onClose}
      >
        <Box
          bg="bg"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="xl"
          p={6}
          maxW="500px"
          w="full"
          mx={4}
          onClick={(e) => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg" fontFamily="heading">
              Create a Group List
            </Heading>

            {error && (
              <Box
                bg="red.subtle"
                color="red.fg"
                p={3}
                borderRadius="md"
                fontSize="sm"
              >
                {error}
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4} align="stretch">
                <Field label="Name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., February Book Club Pick"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this list for?"
                    rows={3}
                  />
                </Field>

                <Field label="Purpose">
                  <VStack align="stretch" gap={2}>
                    {purposes.map((p) => (
                      <HStack key={p.value} as="label" gap={2} cursor="pointer">
                        <input
                          type="radio"
                          name="purpose"
                          value={p.value}
                          checked={purpose === p.value}
                          onChange={(e) => setPurpose(e.target.value)}
                        />
                        <Text>{p.label}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Field>

                <Field label="Track Progress By">
                  <Text fontSize="xs" color="fg.muted" mb={1}>
                    Optionally set how reading segments are tracked for items on this list.
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {segmentTypes.map((s) => (
                      <HStack key={s.value} as="label" gap={2} cursor="pointer">
                        <input
                          type="radio"
                          name="segmentType"
                          value={s.value}
                          checked={segmentType === s.value}
                          onChange={(e) => setSegmentType(e.target.value)}
                        />
                        <Text>{s.label}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Field>

                <Flex justify="flex-end" gap={3} pt={2}>
                  <Button
                    type="button"
                    variant="outline"
                    bg="transparent"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorPalette="accent"
                    bg="accent.solid"
                    disabled={submitting || !name.trim()}
                  >
                    {submitting ? 'Creating...' : 'Create List'}
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
