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
  const [mediaType, setMediaType] = useState<'book' | 'article' | 'video' | 'movie' | 'tv' | 'course'>('book');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

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

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isProcessing) {
      return;
    }

    // For courses, redirect to home where they can use the full add flow with module count
    if (mediaType === 'course') {
      alert('Please use the "Add to Collection" button on your profile to add courses with module information.');
      setSearchQuery('');
      return;
    }

    // For articles and videos, add directly via link endpoint
    if (mediaType === 'article' || mediaType === 'video') {
      setIsProcessing(true);
      try {
        const response = await fetch(`${apiUrl}/media/link`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchQuery,
            mediaType,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch link metadata');
        }

        const data = await response.json();
        
        // If not in database, add it
        if (!data.inDatabase) {
          const addResponse = await fetch(`${apiUrl}/media/add`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: data.title,
              creator: data.author,
              mediaType: data.mediaType || mediaType,
              url: data.url,
              coverImage: data.coverImage,
            }),
          });

          if (addResponse.ok) {
            const addData = await addResponse.json();
            data.mediaItemId = addData.mediaItemId;
          }
        }

        // Navigate to the item details page
        if (data.mediaItemId) {
          navigate(`/items/${data.mediaItemId}`);
        }
      } catch (err) {
        console.error('Failed to add link:', err);
        alert('Failed to add link. Please check the URL and try again.');
      } finally {
        setIsProcessing(false);
        setSearchExpanded(false);
        setSearchQuery('');
      }
    } else {
      // For books, use search page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${mediaType}`);
      setSearchExpanded(false);
      setSearchQuery('');
    }
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setSearchQuery('');
      setMediaType('book');
    }
  };

  return (
    <Box
      as="header"
      position="fixed"
      top={0}
      left={0}
      right={0}
      h={isAuthenticated ? '64px' : 'auto'}
      bg="bg.nav"
      backdropFilter="blur(12px)"
      WebkitBackdropFilter="blur(12px)"
      borderBottom="1px solid"
      borderColor="border.subtle"
      boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.04)"
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
                    color="accent.default"
                    fontFamily="heading"
                    fontWeight="700"
                    letterSpacing="-0.02em"
                  >
                    Collective
                  </Heading>
                </Flex>
              </RouterLink>
            </Link>

            {isAuthenticated && (
              <HStack as="nav" gap={6} display={{ base: 'none', md: 'flex' }}>
                <Link
                  asChild
                  fontSize="sm"
                  fontWeight="500"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  _hover={{
                    color: 'accent.default',
                    textDecoration: 'none',
                  }}
                >
                  <RouterLink to="/collections">Collections</RouterLink>
                </Link>
                <Link
                  asChild
                  fontSize="sm"
                  fontWeight="500"
                  color="fg.muted"
                  textTransform="uppercase"
                  letterSpacing="0.05em"
                  _hover={{
                    color: 'accent.default',
                    textDecoration: 'none',
                  }}
                >
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
                      <Box
                        as="select"
                        value={mediaType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setMediaType(e.target.value as 'book' | 'article' | 'video' | 'movie' | 'tv' | 'course');
                          setSearchQuery('');
                        }}
                        w="100%"
                        p="0.5rem"
                        bg="bg.elevated"
                        borderWidth="1px"
                        borderColor="border.subtle"
                        borderRadius="lg"
                        fontSize="sm"
                        color="fg.default"
                      >
                        <option value="book">Book</option>
                        <option value="movie">Movie</option>
                        <option value="tv">TV Show</option>
                        <option value="article">Article</option>
                        <option value="video">Video</option>
                        <option value="course">Course</option>
                      </Box>
                    </Box>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        (mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv') ? 'Search...' : 'Paste URL...'
                      }
                      size="sm"
                      w="200px"
                      autoFocus
                      disabled={isProcessing}
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
                    outlineColor="accent.default"
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
