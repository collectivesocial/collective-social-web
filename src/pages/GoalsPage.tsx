import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Center,
  Box,
  Badge,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ProgressBar, ProgressRoot } from '../components/ui/progress';
import { LuPencil, LuTrash2, LuRefreshCw } from 'react-icons/lu';
import { GoalModal } from '../components/GoalModal';
import { ShareGoalButton } from '../components/ShareGoalButton';
import { EmptyState } from '../components/EmptyState';
import { toaster } from '../components/ui/toaster';

interface Goal {
  uri: string;
  cid: string;
  title: string;
  mediaType: string | null;
  targetCount: number;
  startDate: string;
  endDate: string;
  visibility: 'public' | 'private';
  createdAt: string;
  completedCount: number;
  percentage: number;
}

interface GoalFormData {
  title: string;
  mediaType: string;
  targetCount: number;
  startDate: string;
  endDate: string;
  visibility: 'public' | 'private';
}

interface GoalsPageProps {
  apiUrl: string;
}

const MEDIA_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  book: { label: 'Books', emoji: '📚' },
  movie: { label: 'Movies', emoji: '🎬' },
  tv: { label: 'TV Shows', emoji: '📺' },
  podcast: { label: 'Podcasts', emoji: '🎙️' },
  article: { label: 'Articles', emoji: '📰' },
  game: { label: 'Games', emoji: '🎮' },
  music: { label: 'Music', emoji: '🎵' },
  course: { label: 'Courses', emoji: '🎓' },
  video: { label: 'Videos', emoji: '📹' },
};

function extractRkey(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${startDate.toLocaleDateString(undefined, opts)} – ${endDate.toLocaleDateString(undefined, opts)}`;
}

function isGoalActive(endDate: string): boolean {
  return new Date(endDate).getTime() >= Date.now();
}

export function GoalsPage({ apiUrl }: GoalsPageProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const navigate = useNavigate();

  const defaultFormData: GoalFormData = {
    title: '',
    mediaType: 'book',
    targetCount: 12,
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: `${new Date().getFullYear()}-12-31`,
    visibility: 'public',
  };

  const [createFormData, setCreateFormData] = useState<GoalFormData>(defaultFormData);
  const [editFormData, setEditFormData] = useState<GoalFormData>(defaultFormData);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${apiUrl}/goals`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setGoals(data.goals);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [apiUrl]);

  const handleRefreshProgress = async () => {
    setRefreshing(true);
    try {
      await fetch(`${apiUrl}/goals/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      await fetchGoals();
      toaster.create({
        title: 'Progress updated',
        description: 'Your goal progress has been refreshed.',
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to refresh progress:', err);
      toaster.create({
        title: 'Refresh failed',
        description: 'Could not refresh goal progress.',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/goals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createFormData,
          startDate: new Date(createFormData.startDate).toISOString(),
          endDate: new Date(createFormData.endDate + 'T23:59:59').toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create goal');
      }

      const data = await response.json();
      setGoals([data.goal, ...goals]);
      setShowCreateModal(false);
      setCreateFormData(defaultFormData);
      toaster.create({
        title: 'Goal created!',
        type: 'success',
        duration: 2000,
      });
    } catch (err: any) {
      console.error('Failed to create goal:', err);
      toaster.create({
        title: 'Failed to create goal',
        description: err.message,
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditFormData({
      title: goal.title,
      mediaType: goal.mediaType || 'book',
      targetCount: goal.targetCount,
      startDate: goal.startDate.split('T')[0],
      endDate: goal.endDate.split('T')[0],
      visibility: goal.visibility,
    });
    setShowEditModal(true);
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const rkey = extractRkey(editingGoal.uri);

    try {
      const response = await fetch(`${apiUrl}/goals/${rkey}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          startDate: new Date(editFormData.startDate).toISOString(),
          endDate: new Date(editFormData.endDate + 'T23:59:59').toISOString(),
          createdAt: editingGoal.createdAt,
        }),
      });

      if (!response.ok) throw new Error('Failed to update goal');

      await fetchGoals();
      setShowEditModal(false);
      setEditingGoal(null);
      toaster.create({
        title: 'Goal updated',
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to update goal:', err);
      toaster.create({
        title: 'Failed to update goal',
        type: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (!window.confirm(`Are you sure you want to delete "${goal.title}"?`)) {
      return;
    }

    const rkey = extractRkey(goal.uri);

    try {
      const response = await fetch(`${apiUrl}/goals/${rkey}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete goal');

      setGoals(goals.filter((g) => g.uri !== goal.uri));
      toaster.create({
        title: 'Goal deleted',
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
      console.error('Failed to delete goal:', err);
      toaster.create({
        title: 'Failed to delete goal',
        type: 'error',
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="accent.default" />
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
        mb={8}
      >
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={2} fontFamily="heading">
            Goals
          </Heading>
          <Text color="fg.muted">
            Set and track your media consumption goals
          </Text>
        </Box>
        <HStack gap={2}>
          <Button
            variant="outline"
            bg="transparent"
            size="sm"
            onClick={handleRefreshProgress}
            disabled={refreshing}
          >
            <LuRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh Progress'}
          </Button>
          <Button
            colorPalette="accent"
            bg="accent.solid"
            onClick={() => setShowCreateModal(true)}
            flexShrink={0}
          >
            + New Goal
          </Button>
        </HStack>
      </Flex>

      {goals.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="No goals yet"
          description="Create a goal to start tracking your reading, watching, or listening progress."
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {goals.map((goal) => {
            const active = isGoalActive(goal.endDate);
            const meta = goal.mediaType
              ? MEDIA_TYPE_LABELS[goal.mediaType]
              : { label: 'Items', emoji: '🎯' };

            return (
              <Box
                key={goal.uri}
                as="article"
                p={6}
                bg="bg.card"
                borderWidth="1px"
                borderColor={active ? 'border.card' : 'border.subtle'}
                borderRadius="xl"
                opacity={active ? 1 : 0.7}
                transition="all 0.25s ease"
                _hover={{
                  borderColor: 'border.focus',
                  shadow: 'md',
                  transform: 'translateY(-2px)',
                }}
              >
                <Flex direction="column" gap={4}>
                  {/* Header */}
                  <Flex justify="space-between" align="flex-start" gap={2}>
                    <Box flex={1} minW={0}>
                      <HStack gap={2} mb={1}>
                        <Text fontSize="xl">{meta.emoji}</Text>
                        <Heading size="md" fontFamily="heading" lineClamp={1}>
                          {goal.title}
                        </Heading>
                      </HStack>
                      <Text color="fg.muted" fontSize="sm">
                        {formatDateRange(goal.startDate, goal.endDate)}
                      </Text>
                    </Box>
                    <HStack gap={0} flexShrink={0}>
                      {goal.visibility === 'private' && (
                        <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                          🔒
                        </Badge>
                      )}
                      {!active && (
                        <Badge colorPalette="gray" variant="subtle" fontSize="xs">
                          Ended
                        </Badge>
                      )}
                    </HStack>
                  </Flex>

                  {/* Progress */}
                  <Box>
                    <Flex justify="space-between" align="baseline" mb={2}>
                      <Text fontSize="2xl" fontWeight="bold" fontFamily="heading">
                        {goal.completedCount}
                        <Text as="span" fontSize="lg" color="fg.muted" fontWeight="normal">
                          {' '}/ {goal.targetCount}
                        </Text>
                      </Text>
                      <Text fontSize="sm" fontWeight="medium" color={goal.percentage >= 100 ? 'green.600' : 'fg.muted'}>
                        {goal.percentage}%
                      </Text>
                    </Flex>
                    <ProgressRoot
                      value={goal.percentage}
                      size="lg"
                      colorPalette={goal.percentage >= 100 ? 'green' : 'accent'}
                      borderRadius="full"
                    >
                      <ProgressBar />
                    </ProgressRoot>
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      {meta.label}
                      {goal.percentage >= 100 && ' ✓ Complete!'}
                    </Text>
                  </Box>

                  {/* Actions */}
                  <Flex justify="flex-end" gap={1} pt={1} borderTopWidth="1px" borderColor="border.subtle">
                    <ShareGoalButton
                      apiUrl={apiUrl}
                      goalUri={goal.uri}
                      goalTitle={goal.title}
                      completedCount={goal.completedCount}
                      targetCount={goal.targetCount}
                      mediaType={goal.mediaType}
                      size="xs"
                    />
                    <IconButton
                      aria-label="Edit goal"
                      variant="ghost"
                      size="xs"
                      bg="transparent"
                      onClick={() => handleEditGoal(goal)}
                    >
                      <LuPencil />
                    </IconButton>
                    <IconButton
                      aria-label="Delete goal"
                      variant="ghost"
                      size="xs"
                      bg="transparent"
                      colorPalette="red"
                      onClick={() => handleDeleteGoal(goal)}
                    >
                      <LuTrash2 />
                    </IconButton>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>
      )}

      {/* Create Goal Modal */}
      <GoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGoal}
        formData={createFormData}
        onChange={setCreateFormData}
        title="Create New Goal"
        submitLabel="Create"
      />

      {/* Edit Goal Modal */}
      <GoalModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingGoal(null);
        }}
        onSubmit={handleUpdateGoal}
        formData={editFormData}
        onChange={setEditFormData}
        title="Edit Goal"
        submitLabel="Save Changes"
      />
    </Container>
  );
}
