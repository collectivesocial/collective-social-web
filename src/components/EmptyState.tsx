import { Center, Heading, Text, VStack } from '@chakra-ui/react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Center
      p={12}
      bg="bg.subtle"
      borderWidth="2px"
      borderStyle="dashed"
      borderColor="border"
      borderRadius="lg"
    >
      <VStack gap={3}>
        {icon && (
          <Text fontSize="5xl" opacity={0.5}>
            {icon}
          </Text>
        )}
        <Heading size="md" color="fg.muted">
          {title}
        </Heading>
        {description && (
          <Text color="fg.muted" textAlign="center" maxW="md">
            {description}
          </Text>
        )}
      </VStack>
    </Center>
  );
}
