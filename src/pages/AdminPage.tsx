import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Table,
  Link as ChakraLink,
  Textarea,
  Tabs,
  Input,
} from '@chakra-ui/react';
import { Field } from '../components/ui/field';
import { EmptyState } from '../components/EmptyState';
import { MediaManagement } from '../components/MediaManagement';

interface User {
  did: string;
  handle?: string;
  firstLoginAt: string;
  lastActivityAt: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Feedback {
  id: number;
  userDid: string | null;
  email: string | null;
  message: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  userHandle?: string;
}

interface AdminPageProps {
  apiUrl: string;
}

export function AdminPage({ apiUrl }: AdminPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        // Check if user is admin
        const adminCheckRes = await fetch(`${apiUrl}/admin/check`, {
          credentials: 'include',
        });

        if (!adminCheckRes.ok) {
          throw new Error('Failed to check admin status');
        }

        const adminData = await adminCheckRes.json();

        if (!adminData.isAdmin) {
          setError('Access denied. Admin privileges required.');
          setLoading(false);
          return;
        }

        setIsAdmin(true);

        // Fetch users data
        const usersRes = await fetch(`${apiUrl}/admin/users`, {
          credentials: 'include',
        });

        if (!usersRes.ok) {
          throw new Error('Failed to fetch users data');
        }

        const usersData = await usersRes.json();
        
        setUsers(usersData.users);
        setTotalUsers(usersData.totalUsers);

        // Fetch feedback data
        const feedbackRes = await fetch(`${apiUrl}/feedback`, {
          credentials: 'include',
        });

        if (!feedbackRes.ok) {
          throw new Error('Failed to fetch feedback data');
        }

        const feedbackData = await feedbackRes.json();
        
        // Fetch user handles for feedback items with userDid
        const feedbackWithHandles = await Promise.all(
          feedbackData.feedback.map(async (item: Feedback) => {
            if (item.userDid) {
              try {
                const profileRes = await fetch(
                  `https://public.api.bsky.app/xrpc/com.atproto.repo.describeRepo?repo=${item.userDid}`
                );
                if (profileRes.ok) {
                  const profileData = await profileRes.json();
                  return { ...item, userHandle: profileData.handle };
                }
              } catch {
                console.error('Failed to fetch handle for', item.userDid);
              }
            }
            return item;
          })
        );
        
        // Sort feedback: new first, then in-progress, then wont-fix, completed last
        const statusOrder: { [key: string]: number } = {
          'new': 0,
          'in-progress': 1,
          'wont-fix': 2,
          'completed': 3,
        };
        
        const sortedFeedback = feedbackWithHandles.sort((a, b) => {
          const orderA = statusOrder[a.status] ?? 4;
          const orderB = statusOrder[b.status] ?? 4;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If same status, sort by date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        setFeedback(sortedFeedback);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [apiUrl]);

  // Filter users based on search query with debounce
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

  const handleEditFeedback = (feedbackItem: Feedback) => {
    setEditingFeedback(feedbackItem.id);
    setFeedbackStatus(feedbackItem.status);
    setFeedbackNotes(feedbackItem.adminNotes || '');
  };

  const handleSaveFeedback = async (feedbackId: number) => {
    try {
      const response = await fetch(`${apiUrl}/feedback/${feedbackId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: feedbackStatus,
          adminNotes: feedbackNotes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }

      // Update local state
      setFeedback(feedback.map(f => 
        f.id === feedbackId 
          ? { ...f, status: feedbackStatus, adminNotes: feedbackNotes || null, updatedAt: new Date().toISOString() }
          : f
      ));
      
      setEditingFeedback(null);
      setFeedbackStatus('');
      setFeedbackNotes('');
    } catch (err) {
      console.error('Failed to update feedback:', err);
      alert('Failed to update feedback');
    }
  };

  const handleCancelEdit = () => {
    setEditingFeedback(null);
    setFeedbackStatus('');
    setFeedbackNotes('');
  };

  if (loading) {
    return (
      <Center minH="50vh">
        <VStack gap={4}>
          <Spinner size="xl" color="accent.default" />
          <Text color="fg.muted">Loading admin dashboard...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !isAdmin) {
    return (
      <Center minH="50vh">
        <VStack gap={4}>
          <Text color="red.500" fontSize="lg">
            {error || 'Access denied'}
          </Text>
          <Button
            onClick={() => navigate('/')}
            colorPalette="accent"
            variant="outline"
          >
            Go Home
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={{ base: 4, md: 8 }}>
      <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading" mb={{ base: 6, md: 8 }}>
        Admin Dashboard
      </Heading>

      <Tabs.Root defaultValue="users" variant="enclosed">
        <Tabs.List mb={6} justifyContent="flex-start">
          <Tabs.Trigger value="users" bg="transparent">Users</Tabs.Trigger>
          <Tabs.Trigger value="media" bg="transparent">Media</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content 
          value="users" 
          borderWidth="1px" 
          borderColor="border.card" 
          borderRadius="xl" 
          p={{ base: 4, md: 6 }}
          bg="bg.subtle"
        >
          {/* Users Section */}
          <Box as="section" mb={{ base: 8, md: 12 }}>
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }} fontFamily="heading">Users</Heading>
          <Badge
            colorPalette="gray"
            size="lg"
            px={4}
            py={2}
          >
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
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', md: 'table-cell' }}>
                  First Login
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Last Activity
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
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
                  <Table.Cell fontSize="sm" display={{ base: 'none', md: 'table-cell' }}>
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
          <Text
            mt={2}
            fontSize="sm"
            color="fg.muted"
            textAlign="center"
          >
            Showing {filteredUsers.length} of {totalUsers} users
          </Text>
        )}
      </Box>

      {/* Feedback Section */}
      <Box as="section" mb={{ base: 8, md: 12 }}>
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }} fontFamily="heading">User Feedback</Heading>
          <Badge
            colorPalette="gray"
            size="lg"
            px={4}
            py={2}
          >
            Total: {feedback.length}
          </Badge>
        </Flex>

        <VStack gap={4} align="stretch">
          {feedback.map((item) => (
            <Box
              key={item.id}
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.card"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
            >
              <Flex
                justify="space-between"
                align={{ base: 'flex-start', sm: 'center' }}
                mb={4}
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 2, sm: 0 }}
              >
                <Flex
                  fontSize="sm"
                  align="center"
                  gap={2}
                  flexWrap="wrap"
                  flex={1}
                >
                  <Text color="fg.muted">#{item.id}</Text>
                  <Text color="fg.muted">•</Text>
                  <Text color="fg.muted">{new Date(item.createdAt).toLocaleString()}</Text>
                  {item.userDid && (
                    <>
                      <Text color="fg.muted">•</Text>
                      {item.userHandle ? (
                        <ChakraLink
                          href={`/profile/${item.userHandle}`}
                          color="accent.default"
                          _hover={{ textDecoration: 'underline' }}
                        >
                          @{item.userHandle}
                        </ChakraLink>
                      ) : (
                        <Text fontFamily="mono" fontSize="xs" color="fg.muted">
                          {item.userDid.substring(0, 20)}...
                        </Text>
                      )}
                    </>
                  )}
                  {!item.userDid && item.email && (
                    <>
                      <Text color="fg.muted">•</Text>
                      <Text fontSize="sm">{item.email}</Text>
                    </>
                  )}
                </Flex>
                {editingFeedback !== item.id && (
                  <Badge
                    colorPalette={
                      item.status === 'new' ? 'red' : 
                      item.status === 'in-progress' ? 'orange' : 
                      item.status === 'wont-fix' ? 'gray' : 
                      'green'
                    }
                    size="sm"
                    textTransform="capitalize"
                  >
                    {item.status}
                  </Badge>
                )}
              </Flex>

              {editingFeedback === item.id ? (
                <VStack gap={4} align="stretch">
                  <Field label="Status">
                    <select
                      value={feedbackStatus}
                      onChange={(e) => setFeedbackStatus(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: 'var(--chakra-colors-bg-subtle)',
                        border: '1px solid var(--chakra-colors-border-card)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        color: 'inherit',
                      }}
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="wont-fix">Won't Fix</option>
                    </select>
                  </Field>

                  <Field label="Admin Notes">
                    <Textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      rows={3}
                      placeholder="Add internal notes about this feedback..."
                      resize="vertical"
                    />
                  </Field>

                  <HStack gap={2}>
                    <Button
                      onClick={() => handleSaveFeedback(item.id)}
                      colorPalette="green"
                      variant="outline"
                      bg="transparent"
                      size="sm"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="ghost"
                      bg="transparent"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <Flex
                  gap={4}
                  align="flex-start"
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Box
                    flex={1}
                    display="grid"
                    gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
                    gap={4}
                  >
                    <Box fontSize="sm">
                      <Text as="strong" color="fg.muted" fontSize="xs" display="block" mb={1}>
                        Feedback:
                      </Text>
                      <Text whiteSpace="pre-wrap">{item.message}</Text>
                    </Box>
                    {item.adminNotes && (
                      <Box fontSize="sm">
                        <Text as="strong" color="fg.muted" fontSize="xs" display="block" mb={1}>
                          Admin Notes:
                        </Text>
                        <Text whiteSpace="pre-wrap">{item.adminNotes}</Text>
                      </Box>
                    )}
                  </Box>
                  <Button
                    onClick={() => handleEditFeedback(item)}
                    colorPalette="accent"
                    variant="outline"
                    bg="transparent"
                    size="sm"
                    flexShrink={0}
                  >
                    Edit
                  </Button>
                </Flex>
              )}
            </Box>
          ))}

          {feedback.length === 0 && (
            <EmptyState
              title="No feedback yet"
              description="User feedback will appear here"
            />
          )}
        </VStack>
      </Box>
        </Tabs.Content>

        <Tabs.Content 
          value="media" 
          borderWidth="1px" 
          borderColor="border.card" 
          borderRadius="xl" 
          p={{ base: 4, md: 6 }}
          bg="bg.subtle"
        >
          <MediaManagement apiUrl={apiUrl} />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
