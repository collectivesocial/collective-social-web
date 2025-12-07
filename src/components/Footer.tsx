import { Box, Container, Flex, Text, Link as ChakraLink, HStack } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="bg"
      borderTopWidth="1px"
      borderTopColor="border"
      py={{ base: 6, md: 8 }}
      mt={0}
    >
      <Container maxW="container.xl">
        <Flex
          direction={{ base: 'column', sm: 'row' }}
          justify="space-between"
          align="center"
          gap={{ base: 4, sm: 2 }}
          textAlign={{ base: 'center', sm: 'left' }}
        >
          <Text color="fg.muted" fontSize="sm">
            © {currentYear} Collective Social
          </Text>
          
          <HStack gap={{ base: 4, md: 8 }} justify={{ base: 'center', sm: 'flex-end' }}>
            <ChakraLink
              href="https://github.com/collectivesocial/collective-social-web"
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              color="fg"
              _hover={{ color: 'teal.500', textDecoration: 'none' }}
            >
              GitHub
            </ChakraLink>
            <ChakraLink
              asChild
              fontSize="sm"
              color="fg"
              _hover={{ color: 'teal.500', textDecoration: 'none' }}
            >
              <RouterLink to="/feedback">
                Provide Feedback
              </RouterLink>
            </ChakraLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
