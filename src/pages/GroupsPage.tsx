import { Container, Heading } from '@chakra-ui/react';

interface GroupsPageProps {
  apiUrl: string;
}

export function GroupsPage({ apiUrl }: GroupsPageProps) {
  return (
    <Container maxW="container.xl" py={8}>
      <Heading size={{ base: 'xl', md: '2xl' }} mb={8}>
        Groups
      </Heading>
    </Container>
  );
}
