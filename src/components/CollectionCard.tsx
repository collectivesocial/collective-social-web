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

  return (
    <Box
      p={6}
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border"
      borderRadius="lg"
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        borderColor: 'teal.500',
        shadow: 'md',
      }}
      onClick={() => navigate(`/collections/${encodeURIComponent(collection.uri)}`)}
    >
      <Flex direction="column" gap={3}>
        <Flex justify="space-between" align="flex-start" gap={2}>
          <Flex align="center" gap={2} flex={1} minW={0}>
            <Heading size="md" lineClamp={1}>
              {collection.name}
            </Heading>
            {collection.isDefault && (
              <Badge colorPalette="teal" variant="subtle" fontSize="xs">
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
              colorPalette="teal"
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
          <Text>{collection.itemCount} items</Text>
          <Text>{new Date(collection.createdAt).toLocaleDateString()}</Text>
        </Flex>
      </Flex>
    </Box>
  );
}
