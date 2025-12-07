import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Link as ChakraLink,
  Textarea,
} from '@chakra-ui/react';
import { Field } from '../../components/ui/field';
import { EmptyState } from '../../components/EmptyState';
import { AdminLayout } from '../../components/AdminLayout';

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

interface AdminUserFeedbackPageProps {
  apiUrl: string;
}

export function AdminUserFeedbackPage({ apiUrl }: AdminUserFeedbackPageProps) {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const feedbackRes = await fetch(`${apiUrl}/feedback`, {
          credentials: 'include',
        });

        if (!feedbackRes.ok) {
          navigate('/');
          return;
        }

        const feedbackData = await feedbackRes.json();
        setFeedback(feedbackData.feedback);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch feedback:', err);
        navigate('/');
      }
    };

    fetchFeedback();
  }, [apiUrl, navigate]);

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
      setFeedback(
        feedback.map((f) =>
          f.id === feedbackId
            ? {
                ...f,
                status: feedbackStatus,
                adminNotes: feedbackNotes || null,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      );

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
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="teal.500" />
            <Text color="fg.muted">Loading feedback...</Text>
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
          <Heading size={{ base: 'xl', md: '2xl' }}>User Feedback</Heading>
          <Badge colorPalette="gray" size="lg" px={4} py={2}>
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
                  <Text color="fg.muted">
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
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
                      item.status === 'new'
                        ? 'red'
                        : item.status === 'in-progress'
                        ? 'orange'
                        : item.status === 'wont-fix'
                        ? 'gray'
                        : 'green'
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
                      <Text
                        as="strong"
                        color="fg.muted"
                        fontSize="xs"
                        display="block"
                        mb={1}
                      >
                        Feedback:
                      </Text>
                      <Text whiteSpace="pre-wrap">{item.message}</Text>
                    </Box>
                    {item.adminNotes && (
                      <Box fontSize="sm">
                        <Text
                          as="strong"
                          color="fg.muted"
                          fontSize="xs"
                          display="block"
                          mb={1}
                        >
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
    </AdminLayout>
  );
}
