import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Link,
  Text,
  Menu,
  Portal,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { LuSearch, LuX } from 'react-icons/lu';
import { ColorModeButton, useColorModeValue, useColorMode, ColorModeIcon } from './ui/color-mode';
import { Avatar } from './ui/avatar';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface HeaderProps {
  user: UserProfile | null;
  isAuthenticated: boolean;
  apiUrl: string;
}

function MobileColorModeToggle() {
  const { toggleColorMode } = useColorMode();
  return (
    <Menu.Item value="theme" onClick={toggleColorMode}>
      <Flex align="center" justify="space-between" w="full">
        <Text>Theme</Text>
        <ColorModeIcon />
      </Flex>
    </Menu.Item>
  );
}

export function Header({ user, isAuthenticated, apiUrl }: HeaderProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaType, setMediaType] = useState('book');
  const navigate = useNavigate();

  // Chakra UI color mode values
  const headerBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const logoFilter = useColorModeValue('none', 'invert(1)');

  useEffect(() => {
    if (isAuthenticated) {
      fetch(`${apiUrl}/admin/check`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false));
    }
  }, [isAuthenticated, apiUrl]);

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${mediaType}`);
      setSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setSearchQuery('');
    }
  };

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      h={isAuthenticated ? '60px' : 'auto'}
      bg={headerBg}
      borderBottom="1px"
      borderColor={borderColor}
      zIndex={1000}
      transition="all 0.3s ease"
    >
      <Container maxW="container.xl" h="full">
        <Flex
          py={isAuthenticated ? 0 : 4}
          h="full"
          justify="space-between"
          align="center"
        >
          <HStack gap={8}>
            <Link asChild _hover={{ textDecoration: 'none' }}>
              <RouterLink to="/">
                <Flex align="center" gap={2}>
                  <Image
                    src="/basket.svg"
                    alt="Collective Logo"
                    boxSize={isAuthenticated ? '1.5rem' : '2.5rem'}
                    transition="all 0.3s ease"
                    filter={logoFilter}
                  />
                  <Heading
                    size={isAuthenticated ? 'lg' : 'xl'}
                    transition="all 0.3s ease"
                  >
                    Collective
                  </Heading>
                </Flex>
              </RouterLink>
            </Link>

            {isAuthenticated && (
              <HStack as="nav" gap={6} display={{ base: 'none', md: 'flex' }}>
                <Link asChild fontSize="md" color="fg.muted" _hover={{ color: 'teal.500' }}>
                  <RouterLink to="/collections">Collections</RouterLink>
                </Link>
                <Link asChild fontSize="md" color="fg.muted" _hover={{ color: 'teal.500' }}>
                  <RouterLink to="/groups">Groups</RouterLink>
                </Link>
              </HStack>
            )}
          </HStack>

          <HStack gap={3}>
            {isAuthenticated && (
              <>
                {searchExpanded ? (
                  <Flex
                    as="form"
                    onSubmit={handleSearchSubmit}
                    gap={2}
                    align="center"
                    display={{ base: 'none', md: 'flex' }}
                  >
                    <Box minW="120px">
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: 'var(--chakra-colors-bg-muted)',
                          border: '1px solid var(--chakra-colors-border)',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          color: 'inherit',
                        }}
                      >
                        <option value="book">Book</option>
                      </select>
                    </Box>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      size="sm"
                      w="200px"
                      autoFocus
                    />
                    <IconButton
                      aria-label="Close search"
                      size="sm"
                      variant="ghost"
                      bg="transparent"
                      onClick={handleSearchToggle}
                    >
                      <LuX />
                    </IconButton>
                  </Flex>
                ) : (
                  <IconButton
                    aria-label="Search"
                    size="sm"
                    variant="ghost"
                    onClick={handleSearchToggle}
                    bg="transparent"
                    display={{ base: 'none', md: 'flex' }}
                  >
                    <LuSearch />
                  </IconButton>
                )}
              </>
            )}

            <Box display={{ base: 'none', md: 'block' }}>
              <ColorModeButton />
            </Box>

            {isAuthenticated && user && (
              <Menu.Root positioning={{ placement: 'bottom-end' }}>
                <Menu.Trigger
                  rounded="full"
                  focusRing="outside"
                  cursor="pointer"
                  bg="transparent"
                >
                  <Avatar
                    size="sm"
                    name={user.displayName || user.handle}
                    src={user.avatar}
                    outline="2px solid"
                    outlineColor="teal.500"
                  />
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Box px={3} py={2}>
                        <Text fontWeight="bold" fontSize="sm">
                          {user.displayName || user.handle}
                        </Text>
                        <Text color="fg.muted" fontSize="xs">
                          @{user.handle}
                        </Text>
                      </Box>
                      <Menu.Separator />
                      <Box display={{ base: 'block', md: 'none' }}>
                        <Menu.Item value="collections" asChild>
                          <RouterLink to="/collections">Collections</RouterLink>
                        </Menu.Item>
                        <Menu.Item value="groups" asChild>
                          <RouterLink to="/groups">Groups</RouterLink>
                        </Menu.Item>
                        <Menu.Separator />
                      </Box>
                      {isAdmin && (
                        <Menu.Item value="admin" asChild>
                          <RouterLink to="/admin">Admin</RouterLink>
                        </Menu.Item>
                      )}
                      <Menu.Item value="profile" asChild>
                        <RouterLink to="/profile">Profile</RouterLink>
                      </Menu.Item>
                      <Menu.Item value="settings" asChild>
                        <RouterLink to="/settings">Settings</RouterLink>
                      </Menu.Item>
                      {isAdmin && <Menu.Separator />}
                      <Box display={{ base: 'block', md: 'none' }}>
                        <Menu.Separator />
                        <MobileColorModeToggle />
                      </Box>
                      <Menu.Separator />
                      <Menu.Item
                        value="logout"
                        onClick={handleLogout}
                        color="fg.error"
                        _hover={{ bg: 'bg.error', color: 'fg.error' }}
                      >
                        Logout
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
