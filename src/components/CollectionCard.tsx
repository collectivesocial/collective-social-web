import { Box, Flex, Heading, Text, Badge, HStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility?: 'public' | 'private';
  isDefault?: boolean;
  purpose: string;
  avatar: string | null;
  itemCount: number;
  createdAt: string;
}

interface CollectionCardProps {
  collection: Collection;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}

export function CollectionCard({ collection, onEdit, onDelete }: CollectionCardProps) {
  const navigate = useNavigate();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`/collections/${encodeURIComponent(collection.uri)}`);
    }
  };

  return (
    <Box
      as="article"
      p={6}
      bg="bg.card"
      borderWidth="1px"
      borderColor="border.card"
      borderRadius="xl"
      cursor="pointer"
      transition="all 0.25s ease"
      _hover={{
        borderColor: 'border.focus',
        shadow: 'md',
        transform: 'translateY(-2px)',
      }}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'border.focus',
        outlineOffset: '2px',
      }}
      onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View collection: ${collection.name}`}
    >
      <Flex direction="column" gap={3}>
        <Flex justify="space-between" align="flex-start" gap={2}>
          <Flex align="center" gap={2} flex={1} minW={0}>
            <Heading size="md" fontFamily="heading" lineClamp={1}>
              {collection.name}
            </Heading>
            {collection.isDefault && (
              <Badge colorPalette="accent" variant="subtle" fontSize="xs">
                Default
              </Badge>
            )}
          </Flex>
          <HStack gap={1} flexShrink={0}>
            {collection.visibility === 'private' && (
              <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                🔒 Private
              </Badge>
            )}
            <Button
              size="xs"
              variant="outline"
              bg="transparent"
              colorPalette="accent"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(collection);
              }}
            >
              Edit
            </Button>
            {!collection.isDefault && (
              <Button
                size="xs"
                variant="outline"
                bg="transparent"
                colorPalette="red"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection);
                }}
              >
                Delete
              </Button>
            )}
          </HStack>
        </Flex>

        {collection.description && (
          <Text color="fg.muted" fontSize="sm" lineClamp={2}>
            {collection.description}
          </Text>
        )}

        <Flex justify="space-between" align="center" fontSize="sm" color="fg.muted">
          <Text><Text as="span" fontWeight="bold">{collection.itemCount}</Text> items</Text>
          <Text>{new Date(collection.createdAt).toLocaleDateString()}</Text>
        </Flex>
      </Flex>
    </Box>
  );
}
