import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Flex, VStack, Text, IconButton, Drawer } from '@chakra-ui/react';
import { LuUsers, LuMessageSquare, LuFilm, LuShare2, LuMenu, LuTags, LuFlag } from 'react-icons/lu';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navSections: NavSection[] = [
    {
      title: 'Users',
      items: [
        { label: 'Users', path: '/admin/users', icon: <LuUsers size={18} /> },
        { label: 'User Feedback', path: '/admin/user-feedback', icon: <LuMessageSquare size={18} /> },
      ],
    },
    {
      title: 'Media',
      items: [
        { label: 'Media Items', path: '/admin/media-items', icon: <LuFilm size={18} /> },
        { label: 'Share Links', path: '/admin/share-links', icon: <LuShare2 size={18} /> },
        { label: 'Tags', path: '/admin/tags', icon: <LuTags size={18} /> },
        { label: 'Tag Reports', path: '/admin/tag-reports', icon: <LuFlag size={18} /> },
      ],
    },
  ];

  const renderNavContent = () => (
    <VStack align="stretch" gap={6}>
      {navSections.map((section) => (
        <Box key={section.title}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            color="fg.muted"
            mb={2}
            px={3}
          >
            {section.title}
          </Text>
          <VStack align="stretch" gap={1}>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Flex
                  key={item.path}
                  align="center"
                  gap={3}
                  px={3}
                  py={2}
                  borderRadius="md"
                  cursor="pointer"
                  bg={isActive ? 'teal.500' : 'transparent'}
                  color={isActive ? 'white' : 'fg'}
                  _hover={{
                    bg: isActive ? 'teal.600' : 'bg.muted',
                  }}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  transition="all 0.2s"
                >
                  {item.icon}
                  <Text fontSize="sm" fontWeight={isActive ? 'semibold' : 'normal'}>
                    {item.label}
                  </Text>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      ))}
    </VStack>
  );

  return (
    <>
      <Flex minH="100vh">
        {/* Desktop Left Navigation */}
        <Box
          w="250px"
          bg="bg.subtle"
          borderRightWidth="1px"
          borderRightColor="border"
          p={6}
          position="sticky"
          top="0"
          h="100vh"
          overflowY="auto"
          display={{ base: 'none', md: 'block' }}
        >
          {renderNavContent()}
        </Box>

        {/* Main Content */}
        <Box flex="1" p={{ base: 4, md: 8 }}>
          {/* Mobile Menu Button */}
          <Flex display={{ base: 'flex', md: 'none' }} mb={4} justify="flex-start">
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              variant="outline"
              bg="transparent"
              size="sm"
            >
              <LuMenu />
            </IconButton>
          </Flex>

          {children}
        </Box>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer.Root
        open={mobileMenuOpen}
        onOpenChange={(e) => setMobileMenuOpen(e.open)}
        placement="start"
      >
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Admin Menu</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              {renderNavContent()}
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Drawer.Root>
    </>
  );
}
