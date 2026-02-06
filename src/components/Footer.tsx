import { Box, Container, Flex, Text, Link as ChakraLink, HStack, Separator } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      as="footer"
      bg="bg.subtle"
      py={{ base: 8, md: 10 }}
      mt="auto"
    >
      <Container maxW="container.xl">
        <Separator mb={{ base: 6, md: 8 }} borderColor="border.subtle" />
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'center', md: 'flex-end' }}
          gap={{ base: 5, md: 2 }}
        >
          {/* Brand + tagline */}
          <Box textAlign={{ base: 'center', md: 'left' }}>
            <Text
              fontFamily="heading"
              fontWeight="700"
              fontSize="lg"
              color="accent.default"
              letterSpacing="-0.02em"
              mb={1}
            >
              Collective
            </Text>
            <Text color="fg.subtle" fontSize="xs">
              Track what you read, watch, and listen to — together.
            </Text>
            <Text color="fg.subtle" fontSize="xs" mt={1}>
              © {currentYear} Collective Social
            </Text>
          </Box>

          {/* Links */}
          <HStack
            gap={{ base: 5, md: 8 }}
            justify={{ base: 'center', md: 'flex-end' }}
          >
            <ChakraLink
              href="https://github.com/collectivesocial/collective-social-web"
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              fontWeight="500"
              color="fg.muted"
              _hover={{ color: 'accent.default', textDecoration: 'none' }}
            >
              GitHub
            </ChakraLink>
            <ChakraLink
              asChild
              fontSize="sm"
              fontWeight="500"
              color="fg.muted"
              _hover={{ color: 'accent.default', textDecoration: 'none' }}
            >
              <RouterLink to="/feedback">
                Feedback
              </RouterLink>
            </ChakraLink>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
