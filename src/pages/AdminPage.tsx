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
  IconButton,
} from '@chakra-ui/react';
import { LuPencil } from 'react-icons/lu';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogBackdrop, DialogPositioner } from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { EmptyState } from '../components/EmptyState';
import { StarRating } from '../components/StarRating';

interface User {
  did: string;
  handle?: string;
  firstLoginAt: string;
  lastActivityAt: string;
  isAdmin: boolean;
  createdAt: string;
}

interface RatingDistribution {
  rating0: number;
  rating0_5: number;
  rating1: number;
  rating1_5: number;
  rating2: number;
  rating2_5: number;
  rating3: number;
  rating3_5: number;
  rating4: number;
  rating4_5: number;
  rating5: number;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  length: number | null;
  totalRatings: number;
  totalReviews: number;
  totalSaves: number;
  averageRating: number | null;
  ratingDistribution?: RatingDistribution;
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

interface ShareLink {
  id: number;
  shortCode: string;
  userDid: string;
  mediaItemId: number;
  mediaType: string;
  timesClicked: number;
  createdAt: string;
  updatedAt: string;
  title: string | null;
  creator: string | null;
  coverImage: string | null;
  url: string;
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [totalMediaItems, setTotalMediaItems] = useState(0);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [totalShareLinks, setTotalShareLinks] = useState(0);
  const [shareLinksPage, setShareLinksPage] = useState(1);
  const [shareLinksPerPage] = useState(20);
  const [shareLinksSortBy, setShareLinksSortBy] = useState<'timesClicked' | 'createdAt'>('timesClicked');
  const [shareLinksOrder, setShareLinksOrder] = useState<'asc' | 'desc'>('desc');
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [loadingMediaDetails, setLoadingMediaDetails] = useState(false);
  const [editMediaTitle, setEditMediaTitle] = useState('');
  const [editMediaCreator, setEditMediaCreator] = useState('');
  const [editMediaCoverImage, setEditMediaCoverImage] = useState('');
  const [editMediaDescription, setEditMediaDescription] = useState('');
  const [editMediaPublishedYear, setEditMediaPublishedYear] = useState('');
  const [editMediaLength, setEditMediaLength] = useState('');
  const [savingMedia, setSavingMedia] = useState(false);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [filteredMediaItems, setFilteredMediaItems] = useState<MediaItem[]>([]);
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

        // Fetch media items data
        const mediaRes = await fetch(`${apiUrl}/admin/media`, {
          credentials: 'include',
        });

        if (!mediaRes.ok) {
          throw new Error('Failed to fetch media data');
        }

        const mediaData = await mediaRes.json();
        setMediaItems(mediaData.mediaItems);
        setTotalMediaItems(mediaData.totalMediaItems);

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
              } catch (err) {
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
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [apiUrl]);

  // Filter media items based on search query with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!mediaSearchQuery.trim()) {
        setFilteredMediaItems(mediaItems);
      } else {
        const query = mediaSearchQuery.toLowerCase();
        setFilteredMediaItems(
          mediaItems.filter(
            (item) =>
              item.title.toLowerCase().includes(query) ||
              (item.creator && item.creator.toLowerCase().includes(query)) ||
              (item.isbn && item.isbn.toLowerCase().includes(query))
          )
        );
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [mediaSearchQuery, mediaItems]);

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

  // Fetch share links separately with pagination
  useEffect(() => {
    const fetchShareLinks = async () => {
      if (!isAdmin) return;

      try {
        const response = await fetch(
          `${apiUrl}/admin/share-links?page=${shareLinksPage}&limit=${shareLinksPerPage}&sortBy=${shareLinksSortBy}&order=${shareLinksOrder}`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setShareLinks(data.links);
          setTotalShareLinks(data.totalLinks);
        }
      } catch (err) {
        console.error('Failed to fetch share links:', err);
      }
    };

    fetchShareLinks();
  }, [apiUrl, isAdmin, shareLinksPage, shareLinksPerPage, shareLinksSortBy, shareLinksOrder]);

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

  const handleEditMedia = async (item: MediaItem) => {
    setEditingMedia(item);
    setMediaModalOpen(true);
    setLoadingMediaDetails(true);
    
    // Fetch full media item details from the database
    try {
      const response = await fetch(`${apiUrl}/media/${item.id}`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Populate form with full data from database
        setEditMediaTitle(data.title || '');
        setEditMediaCreator(data.creator || '');
        setEditMediaCoverImage(data.coverImage || '');
        setEditMediaDescription(data.description || '');
        setEditMediaPublishedYear(data.publishedYear?.toString() || '');
        setEditMediaLength(data.length?.toString() || '');
      } else {
        // Fallback to item data if fetch fails
        setEditMediaTitle(item.title);
        setEditMediaCreator(item.creator || '');
        setEditMediaCoverImage(item.coverImage || '');
        setEditMediaDescription(item.description || '');
        setEditMediaPublishedYear(item.publishedYear?.toString() || '');
        setEditMediaLength(item.length?.toString() || '');
      }
    } catch (err) {
      console.error('Failed to fetch full media item details:', err);
      // Fallback to item data if fetch fails
      setEditMediaTitle(item.title);
      setEditMediaCreator(item.creator || '');
      setEditMediaCoverImage(item.coverImage || '');
      setEditMediaDescription(item.description || '');
      setEditMediaPublishedYear(item.publishedYear?.toString() || '');
      setEditMediaLength(item.length?.toString() || '');
    } finally {
      setLoadingMediaDetails(false);
    }
  };

  const handleCloseMediaModal = () => {
    setMediaModalOpen(false);
    setEditingMedia(null);
    setEditMediaTitle('');
    setEditMediaCreator('');
    setEditMediaCoverImage('');
    setEditMediaDescription('');
    setEditMediaPublishedYear('');
    setEditMediaLength('');
  };

  const handleSaveMedia = async () => {
    if (!editingMedia) return;

    setSavingMedia(true);
    try {
      const response = await fetch(`${apiUrl}/media/${editingMedia.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editMediaTitle,
          creator: editMediaCreator || null,
          coverImage: editMediaCoverImage || null,
          description: editMediaDescription || null,
          publishedYear: editMediaPublishedYear ? parseInt(editMediaPublishedYear) : null,
          length: editMediaLength ? parseInt(editMediaLength) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update media item');
      }

      // Update local state
      setMediaItems(mediaItems.map(item =>
        item.id === editingMedia.id
          ? {
              ...item,
              title: editMediaTitle,
              creator: editMediaCreator || null,
              coverImage: editMediaCoverImage || null,
              description: editMediaDescription || null,
              publishedYear: editMediaPublishedYear ? parseInt(editMediaPublishedYear) : null,
              length: editMediaLength ? parseInt(editMediaLength) : null,
            }
          : item
      ));

      handleCloseMediaModal();
    } catch (err) {
      console.error('Failed to update media item:', err);
      alert('Failed to update media item');
    } finally {
      setSavingMedia(false);
    }
  };

  if (loading) {
    return (
      <Center minH="50vh">
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
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
            colorPalette="teal"
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
      <Heading size={{ base: 'xl', md: '2xl' }} mb={{ base: 6, md: 8 }}>
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
          borderColor="border" 
          borderRadius="lg" 
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
          <Heading size={{ base: 'lg', md: 'xl' }}>Users</Heading>
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
          borderColor="border"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.muted">
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
                        color="teal.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        @{user.handle}
                      </ChakraLink>
                    ) : (
                      <ChakraLink
                        href={`https://pdsls.dev/at://${user.did}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="teal.500"
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
                      <Badge colorPalette="teal" size="sm">
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
          <Heading size={{ base: 'lg', md: 'xl' }}>User Feedback</Heading>
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
              borderColor="border"
              borderRadius="lg"
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
                          color="teal.500"
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
                        backgroundColor: 'var(--chakra-colors-bg-muted)',
                        border: '1px solid var(--chakra-colors-border)',
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
                    colorPalette="teal"
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
          borderColor="border" 
          borderRadius="lg" 
          p={{ base: 4, md: 6 }}
          bg="bg.subtle"
        >
          {/* Media Items Section */}
          <Box as="section" mb={{ base: 8, md: 12 }}>
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }}>Media Items</Heading>
          <Badge
            colorPalette="gray"
            size="lg"
            px={4}
            py={2}
          >
            Total: {totalMediaItems}
          </Badge>
        </Flex>

        <Box mb={4}>
          <Input
            placeholder="Search by title, creator, or ISBN..."
            value={mediaSearchQuery}
            onChange={(e) => setMediaSearchQuery(e.target.value)}
            size="md"
          />
        </Box>

        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.muted">
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  ID
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Title
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', lg: 'table-cell' }}>
                  Creator
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', md: 'table-cell' }}>
                  Type
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', xl: 'table-cell' }}>
                  Pages
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Reviews
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Rated
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center" display={{ base: 'none', sm: 'table-cell' }}>
                  Saved
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
                  Avg Rating
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', lg: 'table-cell' }}>
                  Created
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredMediaItems.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell fontSize="sm" color="fg.muted">
                    {item.id}
                  </Table.Cell>
                  <Table.Cell fontSize="sm">
                    {item.title}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                    {item.creator || '-'}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', md: 'table-cell' }}>
                    <Badge
                      colorPalette="gray"
                      size="sm"
                      textTransform="capitalize"
                    >
                      {item.mediaType}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', xl: 'table-cell' }}>
                    {item.mediaType === 'book' && item.length ? item.length : '-'}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalReviews}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalRatings}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm" display={{ base: 'none', sm: 'table-cell' }}>
                    {item.totalSaves}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm">
                    {item.averageRating ? (
                      <HStack justify="center" gap={1}>
                        <StarRating rating={item.averageRating} size="1em" />
                        <Text>{item.averageRating.toFixed(1)}</Text>
                      </HStack>
                    ) : (
                      <Text color="fg.muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <IconButton
                      aria-label="Edit media item"
                      size="sm"
                      variant="ghost"
                      bg="transparent"
                      onClick={() => handleEditMedia(item)}
                    >
                      <LuPencil />
                    </IconButton>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {totalMediaItems > 10 && (
          <Text
            mt={2}
            fontSize="sm"
            color="fg.muted"
            textAlign="center"
          >
            Showing {filteredMediaItems.length} of {totalMediaItems} media items
          </Text>
        )}
      </Box>

      {/* Share Links Section */}
      <Box as="section">
        <Flex
          justify="space-between"
          align="center"
          mb={4}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'lg', md: 'xl' }}>Share Links</Heading>
          <Badge
            colorPalette="gray"
            size="lg"
            px={4}
            py={2}
          >
            Total: {totalShareLinks}
          </Badge>
        </Flex>

        <Flex mb={3} gap={2} wrap="wrap">
          <Button
            onClick={() => {
              setShareLinksSortBy('timesClicked');
              setShareLinksOrder('desc');
              setShareLinksPage(1);
            }}
            colorPalette="teal"
            variant="outline"
            color={shareLinksSortBy === 'timesClicked' ? 'teal' : 'gray'}
            bg="transparent"
            size="sm"
          >
            Most Clicked
          </Button>
          <Button
            onClick={() => {
              setShareLinksSortBy('createdAt');
              setShareLinksOrder('desc');
              setShareLinksPage(1);
            }}
            colorPalette="teal"
            variant="outline"
            color={shareLinksSortBy === 'createdAt' ? 'teal' : 'gray'}
            bg="transparent"
            size="sm"
          >
            Newest
          </Button>
        </Flex>

        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.muted">
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Item
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', md: 'table-cell' }}>
                  Share Link
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" textAlign="center">
                  Clicks
                </Table.ColumnHeader>
                <Table.ColumnHeader color="fg.muted" fontWeight="medium" display={{ base: 'none', lg: 'table-cell' }}>
                  Created
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {shareLinks.map((link) => (
                <Table.Row key={link.id}>
                  <Table.Cell>
                    {link.title ? (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">{link.title}</Text>
                        {link.creator && (
                          <Text fontSize="xs" color="fg.muted">{link.creator}</Text>
                        )}
                      </Box>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">Unknown Item</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell fontFamily="mono" fontSize="xs" display={{ base: 'none', md: 'table-cell' }}>
                    {link.url}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Text fontSize="sm" fontWeight="bold">{link.timesClicked}</Text>
                  </Table.Cell>
                  <Table.Cell fontSize="sm" display={{ base: 'none', lg: 'table-cell' }}>
                    {new Date(link.createdAt).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {shareLinks.length === 0 && (
          <EmptyState
            title="No share links yet"
            description="Share links created by users will appear here"
          />
        )}

        {totalShareLinks > shareLinksPerPage && (
          <Flex mt={4} justify="space-between" align="center" gap={4}>
            <Button
              onClick={() => setShareLinksPage(shareLinksPage - 1)}
              disabled={shareLinksPage === 1}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Text fontSize="sm" color="fg.muted">
              Page {shareLinksPage} of {Math.ceil(totalShareLinks / shareLinksPerPage)}
            </Text>
            <Button
              onClick={() => setShareLinksPage(shareLinksPage + 1)}
              disabled={shareLinksPage >= Math.ceil(totalShareLinks / shareLinksPerPage)}
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        )}
      </Box>
        </Tabs.Content>
      </Tabs.Root>

      {/* Edit Media Modal */}
      <DialogRoot open={mediaModalOpen} onOpenChange={(e) => setMediaModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
        <DialogContent maxW="2xl">
          <DialogHeader>
            <DialogTitle>Edit Media Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {loadingMediaDetails ? (
              <Center py={8}>
                <VStack gap={4}>
                  <Spinner size="lg" color="teal.500" />
                  <Text color="fg.muted">Loading media details...</Text>
                </VStack>
              </Center>
            ) : (
            <VStack gap={4} align="stretch">
              <Field label="Title" required>
                <Input
                  value={editMediaTitle}
                  onChange={(e) => setEditMediaTitle(e.target.value)}
                  placeholder="Enter title"
                  disabled={loadingMediaDetails}
                />
              </Field>

              <Field label="Creator/Author">
                <Input
                  value={editMediaCreator}
                  onChange={(e) => setEditMediaCreator(e.target.value)}
                  placeholder="Enter creator or author name"
                />
              </Field>

              <Field label="Cover Image URL">
                <Input
                  value={editMediaCoverImage}
                  onChange={(e) => setEditMediaCoverImage(e.target.value)}
                  placeholder="https://example.com/cover.jpg"
                />
              </Field>

              {editMediaCoverImage && (
                <Box>
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    Preview:
                  </Text>
                  <img
                    src={editMediaCoverImage}
                    alt="Cover preview"
                    style={{
                      width: '120px',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--chakra-colors-border)',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Box>
              )}

              <Field label="Description">
                <Textarea
                  value={editMediaDescription}
                  onChange={(e) => setEditMediaDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={5}
                  resize="vertical"
                />
              </Field>

              <Field label="Published Year">
                <Input
                  type="number"
                  value={editMediaPublishedYear}
                  onChange={(e) => setEditMediaPublishedYear(e.target.value)}
                  placeholder="e.g., 2023"
                  min="1000"
                  max="9999"
                />
              </Field>

              {editingMedia && editingMedia.mediaType === 'book' && (
                <Field label="Pages">
                  <Input
                    type="number"
                    value={editMediaLength}
                    onChange={(e) => setEditMediaLength(e.target.value)}
                    placeholder="Number of pages"
                    min="1"
                  />
                </Field>
              )}

              {editingMedia && (
                <Box p={3} bg="bg.muted" borderRadius="md" fontSize="sm">
                  <Text color="fg.muted">
                    <strong>Media Type:</strong> {editingMedia.mediaType}
                  </Text>
                  {editingMedia.isbn && (
                    <Text color="fg.muted">
                      <strong>ISBN:</strong> {editingMedia.isbn}
                    </Text>
                  )}
                  <Text color="fg.muted">
                    <strong>ID:</strong> {editingMedia.id}
                  </Text>
                </Box>
              )}
            </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <HStack gap={2}>
              <Button
                onClick={handleCloseMediaModal}
                variant="outline"
                bg="transparent"
                disabled={savingMedia}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveMedia}
                colorPalette="teal"
                variant="outline"
                bg="transparent"
                disabled={!editMediaTitle || savingMedia}
              >
                {savingMedia ? 'Saving...' : 'Save Changes'}
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Container>
  );
}
