import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  Portal,
} from '@chakra-ui/react';
import { Field } from './ui/field';

interface GoalFormData {
  title: string;
  mediaType: string;
  targetCount: number;
  startDate: string;
  endDate: string;
  visibility: 'public' | 'private';
}

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: GoalFormData;
  onChange: (data: GoalFormData) => void;
  title: string;
  submitLabel: string;
}

const MEDIA_TYPES = [
  { value: 'book', label: '📚 Books' },
  { value: 'movie', label: '🎬 Movies' },
  { value: 'tv', label: '📺 TV Shows' },
  { value: 'podcast', label: '🎙️ Podcasts' },
  { value: 'article', label: '📰 Articles' },
  { value: 'game', label: '🎮 Games' },
  { value: 'music', label: '🎵 Music' },
  { value: 'course', label: '🎓 Courses' },
  { value: 'video', label: '📹 Videos' },
];

const PRESETS = [
  { label: '📚 2026 Reading Challenge', mediaType: 'book', target: 24, title: '2026 Reading Challenge' },
  { label: '🎬 52 Movies in 2026', mediaType: 'movie', target: 52, title: '52 Movies in 2026' },
  { label: '📺 12 TV Shows in 2026', mediaType: 'tv', target: 12, title: '12 TV Shows in 2026' },
];

export function GoalModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  title,
  submitLabel,
}: GoalModalProps) {
  if (!isOpen) return null;

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const year = new Date().getFullYear();
    onChange({
      ...formData,
      title: preset.title,
      mediaType: preset.mediaType,
      targetCount: preset.target,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    });
  };

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
          maxH="90vh"
          overflowY="auto"
          onClick={(e) => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg" fontFamily="heading">
              {title}
            </Heading>

            {/* Quick Presets (only for create) */}
            {submitLabel === 'Create' && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2} color="fg.muted">
                  Quick Start
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      size="xs"
                      variant="outline"
                      bg="transparent"
                      onClick={() => handlePreset(preset)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </HStack>
              </Box>
            )}

            <form onSubmit={onSubmit}>
              <VStack gap={4} align="stretch">
                <Field label="Goal Title" required>
                  <Input
                    value={formData.title}
                    onChange={(e) => onChange({ ...formData, title: e.target.value })}
                    placeholder="e.g., Read 24 books in 2026"
                    required
                  />
                </Field>

                <Field label="Media Type">
                  <select
                    value={formData.mediaType}
                    onChange={(e) =>
                      onChange({ ...formData, mediaType: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      backgroundColor: 'var(--chakra-colors-bg-elevated)',
                      border: '1px solid var(--chakra-colors-border-subtle)',
                      borderRadius: 'var(--chakra-radii-lg)',
                      fontSize: '0.875rem',
                      color: 'var(--chakra-colors-fg-default)',
                    }}
                  >
                    {MEDIA_TYPES.map((mt) => (
                      <option key={mt.value} value={mt.value}>
                        {mt.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Target Count" required>
                  <Input
                    type="number"
                    min={1}
                    max={9999}
                    value={formData.targetCount}
                    onChange={(e) =>
                      onChange({ ...formData, targetCount: parseInt(e.target.value) || 1 })
                    }
                    required
                  />
                </Field>

                <HStack gap={4}>
                  <Field label="Start Date" required>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        onChange({ ...formData, startDate: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="End Date" required>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        onChange({ ...formData, endDate: e.target.value })
                      }
                      required
                    />
                  </Field>
                </HStack>

                <Field label="Visibility">
                  <VStack align="stretch" gap={2}>
                    <HStack as="label" gap={2} cursor="pointer">
                      <input
                        type="radio"
                        name="goalVisibility"
                        value="public"
                        checked={formData.visibility === 'public'}
                        onChange={(e) =>
                          onChange({
                            ...formData,
                            visibility: e.target.value as 'public' | 'private',
                          })
                        }
                      />
                      <Text>Public – Visible on your profile</Text>
                    </HStack>
                    <HStack as="label" gap={2} cursor="pointer">
                      <input
                        type="radio"
                        name="goalVisibility"
                        value="private"
                        checked={formData.visibility === 'private'}
                        onChange={(e) =>
                          onChange({
                            ...formData,
                            visibility: e.target.value as 'public' | 'private',
                          })
                        }
                      />
                      <Text>Private – Only visible to you</Text>
                    </HStack>
                  </VStack>
                </Field>

                <Flex justify="flex-end" gap={3} pt={2}>
                  <Button type="button" variant="outline" bg="transparent" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" colorPalette="accent" bg="accent.solid">
                    {submitLabel}
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
