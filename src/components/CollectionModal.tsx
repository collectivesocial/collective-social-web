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
  Dialog,
  Portal,
} from '@chakra-ui/react';
import { Field } from './ui/field';

interface CollectionFormData {
  name: string;
  description: string;
  visibility: 'public' | 'private';
}

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CollectionFormData;
  onChange: (data: CollectionFormData) => void;
  title: string;
  submitLabel: string;
  isDefault?: boolean;
}

export function CollectionModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  title,
  submitLabel,
  isDefault,
}: CollectionModalProps) {
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
          borderColor="border"
          borderRadius="lg"
          p={6}
          maxW="500px"
          w="full"
          mx={4}
          onClick={(e) => e.stopPropagation()}
        >
          <VStack gap={4} align="stretch">
            <Heading size="lg">
              {title}
              {isDefault && (
                <Text as="span" fontSize="sm" color="fg.muted" fontWeight="normal" ml={2}>
                  (Default list cannot be deleted)
                </Text>
              )}
            </Heading>

            <form onSubmit={onSubmit}>
              <VStack gap={4} align="stretch">
                <Field label="Name" required>
                  <Input
                    value={formData.name}
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
                    placeholder="e.g., Books to Read"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={formData.description}
                    onChange={(e) => onChange({ ...formData, description: e.target.value })}
                    placeholder="Describe your collection..."
                    rows={3}
                  />
                </Field>

                <Field label="Visibility">
                  <VStack align="stretch" gap={2}>
                    <HStack gap={4}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={formData.visibility === 'public'}
                          onChange={(e) =>
                            onChange({
                              ...formData,
                              visibility: e.target.value as 'public' | 'private',
                            })
                          }
                          style={{ cursor: 'pointer' }}
                        />
                        <Text>Public - Visible on your profile</Text>
                      </label>
                    </HStack>
                    <HStack gap={4}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={formData.visibility === 'private'}
                          onChange={(e) =>
                            onChange({
                              ...formData,
                              visibility: e.target.value as 'public' | 'private',
                            })
                          }
                          style={{ cursor: 'pointer' }}
                        />
                        <Text>Private - Only visible to you</Text>
                      </label>
                    </HStack>
                  </VStack>
                </Field>

                <Flex justify="flex-end" gap={3} pt={2}>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" colorPalette="teal">
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
