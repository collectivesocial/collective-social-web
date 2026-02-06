import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
  Badge,
  Table,
  Link as ChakraLink,
  Input,
} from '@chakra-ui/react';
import { AdminLayout } from '../../components/AdminLayout';

interface User {
  did: string;
  handle?: string;
  firstLoginAt: string;
  lastActivityAt: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminUsersPageProps {
  apiUrl: string;
}

export function AdminUsersPage({ apiUrl }: AdminUsersPageProps) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRes = await fetch(`${apiUrl}/admin/users`, {
          credentials: 'include',
        });

        if (!usersRes.ok) {
          navigate('/');
          return;
        }

        const usersData = await usersRes.json();
        setUsers(usersData.users);
        setTotalUsers(usersData.totalUsers);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        navigate('/');
      }
    };

    fetchUsers();
  }, [apiUrl, navigate]);

  // Filter users based on search query
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!userSearchQuery.trim()) {
        setFilteredUsers(users);
      } else {
        const query = userSearchQuery.toLowerCase();
        setFilteredUsers(
          users.filter(
            (user) =>
              user.did.toLowerCase().includes(query) ||
              (user.handle && user.handle.toLowerCase().includes(query))
          )
        );
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, users]);

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Loading users...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading">Users</Heading>
          <Badge colorPalette="gray" size="lg" px={4} py={2}>
            Total: {totalUsers}
          </Badge>
        </Flex>

        <Box mb={4}>
          <Input
            placeholder="Search by DID or handle..."
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            size="md"
          />
        </Box>

        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Handle
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  display={{ base: 'none', md: 'table-cell' }}
                >
                  First Login
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Last Activity
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                >
                  Admin
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredUsers.map((user) => (
                <Table.Row key={user.did}>
                  <Table.Cell fontSize="sm">
                    {user.handle ? (
                      <ChakraLink
                        href={`/profile/${user.handle}`}
                        color="accent.default"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        @{user.handle}
                      </ChakraLink>
                    ) : (
                      <ChakraLink
                        href={`https://pdsls.dev/at://${user.did}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="accent.default"
                        fontFamily="mono"
                        fontSize="xs"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        {user.did.substring(0, 24)}...
                      </ChakraLink>
                    )}
                  </Table.Cell>
                  <Table.Cell
                    fontSize="sm"
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    {new Date(user.firstLoginAt).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell fontSize="sm">
                    {new Date(user.lastActivityAt).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    {user.isAdmin ? (
                      <Badge colorPalette="accent" size="sm">
                        YES
                      </Badge>
                    ) : (
                      <Text color="fg.muted">-</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {totalUsers > 10 && (
          <Text mt={2} fontSize="sm" color="fg.muted" textAlign="center">
            Showing {filteredUsers.length} of {totalUsers} users
          </Text>
        )}
      </Box>
    </AdminLayout>
  );
}
