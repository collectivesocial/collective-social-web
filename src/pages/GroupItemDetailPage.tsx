import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Badge,
  Spinner,
  Center,
  Input,
  Textarea,
  Image,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogPositioner,
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { EmptyState } from '../components/EmptyState';

// ── Interfaces ───────────────────────────────────────────────────

interface CollectionPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface ItemRecord {
  uri: string;
  rkey: string;
  listUri: string;
  title: string;
  creator?: string;
  mediaItemId?: number;
  mediaType: string;
  order: number;
  addedBy: string;
  status: string;
  createdAt: string;
}

interface Segment {
  uri: string;
  rkey: string;
  listItemUri: string;
  label: string;
  segmentType?: string;
  startPage?: number;
  endPage?: number;
  startPercent?: number;
  endPercent?: number;
  startChapter?: number;
  endChapter?: number;
  assignedDate?: string;
  order: number;
  createdBy: string;
  createdAt: string;
}

interface SegmentProgress {
  uri: string;
  rkey: string;
  segmentUri: string;
  memberDid: string;
  completed: boolean;
  completedAt: string;
}

interface Post {
  uri: string;
  rkey: string;
  text: string;
  segmentUri?: string;
  listItemUri?: string;
  parentPostUri?: string;
  authorDid: string;
  createdAt: string;
  replies: Post[];
}

interface MediaItem {
  id: number;
  title: string;
  creator: string | null;
  coverImage: string | null;
  description: string | null;
  mediaType: string;
  length: number | null;
  publishedYear: number | null;
}

interface GroupItemDetailPageProps {
  apiUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────

const mediaTypeLabels: Record<string, string> = {
  book: 'book',
  movie: 'movie',
  tv: 'TV show',
  music: 'album',
  game: 'game',
  podcast: 'podcast',
  article: 'article',
  video: 'video',
  course: 'course',
};

const mediaTypeEmoji: Record<string, string> = {
  book: '📖',
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  game: '🎮',
  podcast: '🎙️',
  article: '📰',
  video: '📹',
  course: '🎓',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function segmentRangeLabel(seg: Segment): string {
  if (seg.segmentType === 'chapters' && seg.startChapter != null) {
    if (seg.endChapter != null && seg.endChapter !== seg.startChapter) {
      return `Chapters ${seg.startChapter}–${seg.endChapter}`;
    }
    return `Chapter ${seg.startChapter}`;
  }
  if (seg.segmentType === 'pages' && seg.startPage != null) {
    if (seg.endPage != null && seg.endPage !== seg.startPage) {
      return `Pages ${seg.startPage}–${seg.endPage}`;
    }
    return `Page ${seg.startPage}`;
  }
  if (seg.startPercent != null && seg.endPercent != null) {
    if (seg.startPercent === 0 && seg.endPercent === 100) return 'Entire work';
    return `${seg.startPercent}%–${seg.endPercent}%`;
  }
  return '';
}

// ── Component ────────────────────────────────────────────────────

export function GroupItemDetailPage({ apiUrl }: GroupItemDetailPageProps) {
  const { groupDid, listRkey, itemRkey } = useParams<{
    groupDid: string;
    listRkey: string;
    itemRkey: string;
  }>();
  const navigate = useNavigate();

  // Core data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, SegmentProgress[]>>({});
  const [myProgressSet, setMyProgressSet] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Record<string, CollectionPermission>>({});
  const [userDid, setUserDid] = useState<string | null>(null);

  // Discussion per segment
  const [postsBySegment, setPostsBySegment] = useState<Record<string, Post[]>>({});
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Segment CRUD
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [segLabel, setSegLabel] = useState('');
  const [segType, setSegType] = useState<string>('percent');
  const [segStart, setSegStart] = useState('');
  const [segEnd, setSegEnd] = useState('');
  const [segDueDate, setSegDueDate] = useState('');
  const [segIsWhole, setSegIsWhole] = useState(false);
  const [segSaving, setSegSaving] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteSegmentRkey, setDeleteSegmentRkey] = useState<string | null>(null);
  const [deletingSegment, setDeletingSegment] = useState(false);

  // Roster toggle
  const [showRoster, setShowRoster] = useState<string | null>(null);

  // Track in library
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);

  const segmentPerm = permissions['app.collectivesocial.group.segment'];
  const postPerm = permissions['app.collectivesocial.group.post'];

  // ── Data fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!groupDid || !listRkey || !itemRkey) return;

    try {
      // Fetch in parallel: list data, permissions (lightweight), user info
      const [listRes, permRes, userRes] = await Promise.all([
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/lists/${encodeURIComponent(listRkey)}`,
          { credentials: 'include' }
        ),
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/permissions`,
          { credentials: 'include' }
        ),
        fetch(`${apiUrl}/users/me`, { credentials: 'include' }),
      ]);

      if (!listRes.ok) {
        throw new Error(listRes.status === 403
          ? 'You must be a member of this group to view this item'
          : 'Failed to load item details');
      }

      const listData = await listRes.json();
      const foundItem = (listData.items || []).find((i: ItemRecord) => i.rkey === itemRkey);
      if (!foundItem) throw new Error('Item not found in this list');
      setItem(foundItem);

      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData.permissions || {});
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserDid(userData.did || null);
      }

      // Fetch media item details if we have a mediaItemId
      if (foundItem.mediaItemId) {
        try {
          const mediaRes = await fetch(
            `${apiUrl}/media/${foundItem.mediaItemId}`,
            { credentials: 'include' }
          );
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            setMediaItem(mediaData);
          }
        } catch {
          // Non-fatal
        }
      }

      // Fetch segments + all progress in parallel (batch endpoint)
      const [segRes, progressRes] = await Promise.all([
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/items/${encodeURIComponent(itemRkey)}/segments`,
          { credentials: 'include' }
        ),
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/items/${encodeURIComponent(itemRkey)}/progress`,
          { credentials: 'include' }
        ),
      ]);

      if (segRes.ok) {
        const segData = await segRes.json();
        const segs: Segment[] = segData.segments || [];
        setSegments(segs);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgressMap(progressData.progressBySegment || {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, groupDid, listRkey, itemRkey]);

  // Separate effect to build myProgressSet once we have both progressMap and userDid
  useEffect(() => {
    if (!userDid) return;
    const mySet = new Set<string>();
    for (const [segUri, progs] of Object.entries(progressMap)) {
      if (progs.some((p) => p.memberDid === userDid && p.completed)) {
        mySet.add(segUri);
      }
    }
    setMyProgressSet(mySet);
  }, [progressMap, userDid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Segment CRUD handlers ─────────────────────────────────────

  const openAddSegment = () => {
    setSegLabel('');
    setSegType('percent');
    setSegStart('');
    setSegEnd('');
    setSegDueDate('');
    setSegIsWhole(false);
    setEditingSegment(null);
    setShowAddSegment(true);
  };

  const openEditSegment = (seg: Segment) => {
    setSegLabel(seg.label);
    setSegType(seg.segmentType || 'percent');
    if (seg.startPercent === 0 && seg.endPercent === 100) {
      setSegIsWhole(true);
      setSegStart('');
      setSegEnd('');
    } else {
      setSegIsWhole(false);
      if (seg.segmentType === 'chapters') {
        setSegStart(seg.startChapter?.toString() || '');
        setSegEnd(seg.endChapter?.toString() || '');
      } else if (seg.segmentType === 'pages') {
        setSegStart(seg.startPage?.toString() || '');
        setSegEnd(seg.endPage?.toString() || '');
      } else {
        setSegStart(seg.startPercent?.toString() || '');
        setSegEnd(seg.endPercent?.toString() || '');
      }
    }
    setSegDueDate(seg.assignedDate ? seg.assignedDate.split('T')[0] : '');
    setEditingSegment(seg);
    setShowAddSegment(true);
  };

  const handleSaveSegment = async () => {
    if (!segLabel.trim()) return;
    setSegSaving(true);

    const body: Record<string, unknown> = { label: segLabel.trim() };

    if (segIsWhole) {
      body.segmentType = 'percent';
      body.startPercent = 0;
      body.endPercent = 100;
    } else {
      body.segmentType = segType;
      const start = parseInt(segStart);
      const end = parseInt(segEnd);
      if (segType === 'chapters') {
        if (!isNaN(start)) body.startChapter = start;
        if (!isNaN(end)) body.endChapter = end;
      } else if (segType === 'pages') {
        if (!isNaN(start)) body.startPage = start;
        if (!isNaN(end)) body.endPage = end;
      } else {
        if (!isNaN(start)) body.startPercent = start;
        if (!isNaN(end)) body.endPercent = end;
      }
    }

    if (segDueDate) {
      body.assignedDate = new Date(segDueDate + 'T23:59:59Z').toISOString();
    }

    try {
      const url = editingSegment
        ? `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(editingSegment.rkey)}`
        : `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/items/${encodeURIComponent(itemRkey!)}/segments`;
      const method = editingSegment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save segment');

      setShowAddSegment(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save segment:', err);
    } finally {
      setSegSaving(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!deleteSegmentRkey) return;
    setDeletingSegment(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(deleteSegmentRkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to delete segment');
      setDeleteSegmentRkey(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete segment:', err);
    } finally {
      setDeletingSegment(false);
    }
  };

  // ── Progress handlers ──────────────────────────────────────────

  const handleMarkCompleted = async (segRkey: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/progress`,
        { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Mark progress failed:', res.status, errBody);
        throw new Error(errBody.error || `Failed to mark progress (${res.status})`);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to mark progress:', err);
    }
  };

  const handleUnmarkCompleted = async (segRkey: string, segUri: string) => {
    // Find our progress record
    const progs = progressMap[segUri] || [];
    const mine = progs.find((p) => p.memberDid === userDid);
    if (!mine) return;

    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/progress/${encodeURIComponent(mine.rkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to unmark progress');
      await fetchData();
    } catch (err) {
      console.error('Failed to unmark progress:', err);
    }
  };

  // ── Discussion handlers ────────────────────────────────────────

  const fetchPosts = async (segRkey: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/posts`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        // Find the segment URI from rkey
        const seg = segments.find((s) => s.rkey === segRkey);
        if (seg) {
          setPostsBySegment((prev) => ({ ...prev, [seg.uri]: data.posts || [] }));
        }
      }
    } catch { /* non-fatal */ }
  };

  const handleToggleDiscussion = async (segRkey: string, segUri: string) => {
    if (expandedSegment === segUri) {
      setExpandedSegment(null);
    } else {
      setExpandedSegment(segUri);
      await fetchPosts(segRkey);
    }
  };

  const handlePostComment = async (segRkey: string, segUri: string, parentUri?: string) => {
    const text = parentUri ? replyText : postText;
    if (!text.trim()) return;
    setPostingComment(true);

    try {
      const body: Record<string, string> = { text: text.trim(), segmentUri: segUri };
      if (parentUri) body.parentPostUri = parentUri;

      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/posts`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error('Failed to post comment');

      if (parentUri) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setPostText('');
      }
      await fetchPosts(segRkey);
    } catch (err) {
      console.error('Failed to post:', err);
    } finally {
      setPostingComment(false);
    }
  };

  // ── Track in library ───────────────────────────────────────────

  const handleTrackInLibrary = async () => {
    if (!item) return;
    setTracking(true);
    try {
      const res = await fetch(`${apiUrl}/collections/quick-add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaItemId: item.mediaItemId,
          mediaType: item.mediaType,
          title: item.title,
          creator: item.creator,
          status: 'in-progress',
        }),
      });
      if (res.ok) setTracked(true);
    } catch (err) {
      console.error('Failed to add to library:', err);
    } finally {
      setTracking(false);
    }
  };

  // ── Render helpers ─────────────────────────────────────────────

  /**
   * Determine if the user can see discussion for a segment.
   * They can if they've completed this segment OR any later-ordered segment.
   */
  const canSeeDiscussion = (seg: Segment): boolean => {
    if (myProgressSet.has(seg.uri)) return true;
    // Check if user has completed any segment with higher order
    for (const s of segments) {
      if (s.order > seg.order && myProgressSet.has(s.uri)) return true;
    }
    return false;
  };

  const renderPostTree = (posts: Post[], segRkey: string, segUri: string, depth = 0) => {
    return posts.map((post) => (
      <Box
        key={post.uri}
        ml={depth > 0 ? 6 : 0}
        pl={depth > 0 ? 4 : 0}
        borderLeftWidth={depth > 0 ? '2px' : '0'}
        borderColor="border.subtle"
        mb={3}
      >
        <Box bg={depth > 0 ? 'transparent' : 'bg.subtle'} p={3} borderRadius="md">
          <Text fontSize="xs" color="fg.muted" mb={1}>
            {(post.authorDid ?? 'Unknown').slice(0, 20)}… · {formatDate(post.createdAt)}
          </Text>
          <Text fontSize="sm" whiteSpace="pre-wrap">{post.text}</Text>
          {postPerm?.canCreate && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="blue"
              mt={1}
              onClick={() => {
                setReplyingTo(replyingTo === post.uri ? null : post.uri);
                setReplyText('');
              }}
            >
              Reply
            </Button>
          )}
        </Box>

        {replyingTo === post.uri && (
          <Box ml={6} mt={2}>
            <HStack gap={2}>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                size="sm"
                rows={2}
                flex={1}
              />
              <VStack gap={1}>
                <Button
                  size="xs"
                  colorPalette="accent"
                  onClick={() => handlePostComment(segRkey, segUri, post.uri)}
                  disabled={!replyText.trim() || postingComment}
                >
                  {postingComment ? '...' : 'Send'}
                </Button>
                <Button size="xs" variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
              </VStack>
            </HStack>
          </Box>
        )}

        {post.replies?.length > 0 && renderPostTree(post.replies, segRkey, segUri, depth + 1)}
      </Box>
    ));
  };

  // ── Loading / Error states ─────────────────────────────────────

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.solid" />
            <Text color="fg.muted">Loading item...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxW="4xl" py={8}>
        <EmptyState
          icon="😕"
          title={error || 'Item not found'}
          description="This item may not exist or you may need to join the group first."
        />
        <Center mt={6}>
          <Button variant="outline" onClick={() => navigate(`/groups/${encodeURIComponent(groupDid!)}`)}>
            ← Back to Group
          </Button>
        </Center>
      </Container>
    );
  }

  const totalSegments = segments.length;
  const completedSegments = segments.filter((s) => myProgressSet.has(s.uri)).length;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() => navigate(`/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}`)}
          color="fg.muted"
          _hover={{ color: 'fg.default' }}
        >
          ← Back to List
        </Button>

        {/* ── Item Header ──────────────────────────────────────── */}
        <Box bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card" p={6}>
          <Flex gap={6} direction={{ base: 'column', sm: 'row' }}>
            {/* Cover image */}
            {mediaItem?.coverImage && (
              <Image
                src={mediaItem.coverImage}
                alt={item.title}
                w="120px"
                h="180px"
                objectFit="cover"
                borderRadius="lg"
                flexShrink={0}
              />
            )}

            <Box flex={1}>
              <HStack gap={2} mb={1}>
                <Text fontSize="2xl">{mediaTypeEmoji[item.mediaType] || '📄'}</Text>
                <Heading size="xl" fontFamily="heading">{item.title}</Heading>
              </HStack>

              {(item.creator || mediaItem?.creator) && (
                <Text fontSize="md" color="fg.muted" mb={2}>
                  by {item.creator || mediaItem?.creator}
                </Text>
              )}

              {mediaItem?.description && (
                <Text fontSize="sm" color="fg.muted" mb={3} lineClamp={3}>
                  {mediaItem.description}
                </Text>
              )}

              <HStack gap={3} flexWrap="wrap" mb={4}>
                <Badge colorPalette="blue" size="sm">{item.status}</Badge>
                {mediaItem?.publishedYear && (
                  <Text fontSize="xs" color="fg.subtle">{mediaItem.publishedYear}</Text>
                )}
                {mediaItem?.length && (
                  <Text fontSize="xs" color="fg.subtle">
                    {item.mediaType === 'book' ? `${mediaItem.length} pages` : `${mediaItem.length} min`}
                  </Text>
                )}
              </HStack>

              {/* Action buttons */}
              <HStack gap={2} flexWrap="wrap">
                {userDid && !tracked && (
                  <Button
                    size="sm"
                    colorPalette="accent"
                    variant="outline"
                    onClick={handleTrackInLibrary}
                    disabled={tracking}
                  >
                    {tracking ? 'Adding...' : '📚 Track in My Library'}
                  </Button>
                )}
                {tracked && (
                  <Badge colorPalette="green" size="sm">✓ In Your Library</Badge>
                )}
                {item.mediaItemId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/items/${item.mediaItemId}`)}
                    color="fg.muted"
                  >
                    View Details →
                  </Button>
                )}
              </HStack>
            </Box>
          </Flex>
        </Box>

        {/* ── Personal Progress Summary ────────────────────────── */}
        {totalSegments > 0 && (
          <Box bg="bg.card" borderRadius="lg" borderWidth="1px" borderColor="border.card" p={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" fontWeight="bold">Your Progress</Text>
              <Text fontSize="sm" color="fg.muted">
                {completedSegments} / {totalSegments} segments completed
              </Text>
            </Flex>
            <Box bg="bg.subtle" borderRadius="full" h="8px" overflow="hidden">
              <Box
                bg="green.solid"
                h="100%"
                w={`${totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0}%`}
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        )}

        {/* ── Segments Timeline ────────────────────────────────── */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontFamily="heading">
              📅 Reading Schedule
            </Heading>
            {segmentPerm?.canCreate && (
              <Button size="sm" colorPalette="accent" variant="outline" onClick={openAddSegment}>
                + Add Assignment
              </Button>
            )}
          </Flex>

          {segments.length > 0 ? (
            <VStack gap={4} align="stretch">
              {segments.map((seg) => {
                const progs = progressMap[seg.uri] || [];
                const completedCount = progs.filter((p) => p.completed).length;
                const iCompleted = myProgressSet.has(seg.uri);
                const isDue = seg.assignedDate && new Date(seg.assignedDate) < new Date();
                const canSee = canSeeDiscussion(seg);
                const posts = postsBySegment[seg.uri] || [];

                return (
                  <Box
                    key={seg.rkey}
                    bg="bg.card"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={iCompleted ? 'green.muted' : isDue ? 'orange.muted' : 'border.card'}
                    overflow="hidden"
                  >
                    {/* Segment header */}
                    <Box p={4}>
                      <Flex justify="space-between" align="start">
                        <Box flex={1}>
                          <HStack gap={2} mb={1}>
                            <Text fontSize="lg" fontWeight="bold">{seg.label}</Text>
                            {iCompleted && (
                              <Badge colorPalette="green" size="sm">✓ Completed</Badge>
                            )}
                            {!iCompleted && isDue && (
                              <Badge colorPalette="orange" size="sm">Overdue</Badge>
                            )}
                          </HStack>

                          <HStack gap={3} fontSize="sm" color="fg.muted" flexWrap="wrap">
                            {segmentRangeLabel(seg) && (
                              <Text>{segmentRangeLabel(seg)}</Text>
                            )}
                            {seg.assignedDate && (
                              <Text>Due {formatDate(seg.assignedDate)}</Text>
                            )}
                            <Text>{completedCount} member{completedCount !== 1 ? 's' : ''} completed</Text>
                          </HStack>
                        </Box>

                        <HStack gap={2}>
                          {/* Mark completed / unmark */}
                          {userDid && !iCompleted && (
                            <Button
                              size="sm"
                              colorPalette="green"
                              variant="outline"
                              onClick={() => handleMarkCompleted(seg.rkey)}
                            >
                              ✓ Mark Done
                            </Button>
                          )}
                          {userDid && iCompleted && (
                            <Button
                              size="sm"
                              variant="ghost"
                              colorPalette="gray"
                              onClick={() => handleUnmarkCompleted(seg.rkey, seg.uri)}
                            >
                              Undo
                            </Button>
                          )}

                          {/* Admin actions */}
                          {segmentPerm?.canUpdate && (
                            <Button size="xs" variant="ghost" onClick={() => openEditSegment(seg)}>
                              Edit
                            </Button>
                          )}
                          {segmentPerm?.canDelete && (
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() => setDeleteSegmentRkey(seg.rkey)}
                            >
                              Delete
                            </Button>
                          )}
                        </HStack>
                      </Flex>

                      {/* Roster toggle (admin) */}
                      {segmentPerm?.canRead && completedCount > 0 && (
                        <Box mt={2}>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setShowRoster(showRoster === seg.rkey ? null : seg.rkey)}
                          >
                            {showRoster === seg.rkey ? 'Hide' : 'Show'} member progress
                          </Button>
                          {showRoster === seg.rkey && (
                            <Box mt={2} p={3} bg="bg.subtle" borderRadius="md">
                              <VStack gap={1} align="stretch">
                                {progs.filter((p) => p.completed).map((p) => (
                                  <HStack key={p.rkey} justify="space-between">
                                    <Text fontSize="xs" color="fg.muted">
                                      {p.memberDid.slice(0, 24)}…
                                    </Text>
                                    <Text fontSize="xs" color="fg.subtle">
                                      {formatDate(p.completedAt)}
                                    </Text>
                                  </HStack>
                                ))}
                              </VStack>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Discussion section */}
                    <Box borderTopWidth="1px" borderColor="border.subtle">
                      <Button
                        variant="ghost"
                        w="full"
                        borderRadius="0"
                        size="sm"
                        onClick={() => handleToggleDiscussion(seg.rkey, seg.uri)}
                        color="fg.muted"
                      >
                        💬 Discussion {expandedSegment === seg.uri ? '▲' : '▼'}
                      </Button>

                      {expandedSegment === seg.uri && (
                        <Box p={4} pt={2}>
                          {canSee ? (
                            <VStack gap={3} align="stretch">
                              {posts.length > 0 ? (
                                renderPostTree(posts, seg.rkey, seg.uri)
                              ) : (
                                <Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
                                  No comments yet. Be the first to share your thoughts!
                                </Text>
                              )}

                              {/* New comment form */}
                              {postPerm?.canCreate && (
                                <HStack gap={2} mt={2}>
                                  <Textarea
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder="Share your thoughts on this section..."
                                    size="sm"
                                    rows={2}
                                    flex={1}
                                  />
                                  <Button
                                    size="sm"
                                    colorPalette="accent"
                                    onClick={() => handlePostComment(seg.rkey, seg.uri)}
                                    disabled={!postText.trim() || postingComment}
                                  >
                                    {postingComment ? '...' : 'Post'}
                                  </Button>
                                </HStack>
                              )}
                            </VStack>
                          ) : (
                            <Box textAlign="center" py={6}>
                              <Text fontSize="2xl" mb={2}>🔒</Text>
                              <Text fontSize="sm" color="fg.muted">
                                Complete this segment to see the discussion and avoid spoilers.
                              </Text>
                              <Button
                                size="sm"
                                colorPalette="green"
                                variant="outline"
                                mt={3}
                                onClick={() => handleMarkCompleted(seg.rkey)}
                              >
                                ✓ I've finished this section
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <EmptyState
              icon="📅"
              title="No assignments yet"
              description={
                segmentPerm?.canCreate
                  ? `Add reading or watching assignments so the group knows what to ${mediaTypeLabels[item.mediaType] || 'complete'} by when.`
                  : 'The group admin hasn\'t set any assignments yet.'
              }
            />
          )}
        </Box>
      </VStack>

      {/* ── Add/Edit Segment Dialog ──────────────────────────── */}
      <DialogRoot open={showAddSegment} onOpenChange={(e) => setShowAddSegment(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSegment ? 'Edit Assignment' : 'Add Assignment'}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color="fg.muted">
                  What portion of this {mediaTypeLabels[item.mediaType] || 'item'} should be completed, and by when?
                </Text>

                <Field label="Label">
                  <Input
                    value={segLabel}
                    onChange={(e) => setSegLabel(e.target.value)}
                    placeholder={`e.g. "Chapters 1-5" or "Episode 1"`}
                    autoFocus
                  />
                </Field>

                {/* Whole item toggle */}
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant={segIsWhole ? 'solid' : 'outline'}
                    colorPalette={segIsWhole ? 'accent' : 'gray'}
                    onClick={() => setSegIsWhole(!segIsWhole)}
                  >
                    {segIsWhole ? '✓ ' : ''}The entire {mediaTypeLabels[item.mediaType] || 'item'}
                  </Button>
                </HStack>

                {!segIsWhole && (
                  <>
                    <Field label="Segment Type">
                      <Box
                        as="select"
                        value={segType}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          setSegType(e.target.value);
                          setSegStart('');
                          setSegEnd('');
                        }}
                        w="100%"
                        p="0.5rem 0.75rem"
                        bg="bg.subtle"
                        borderWidth="1px"
                        borderColor="border.card"
                        borderRadius="md"
                        fontSize="sm"
                        color="fg.default"
                      >
                        <option value="chapters">Chapters</option>
                        <option value="pages">Pages</option>
                        <option value="percent">Percent</option>
                      </Box>
                    </Field>

                    <HStack gap={4}>
                      <Field label="From">
                        <Input
                          type="number"
                          value={segStart}
                          onChange={(e) => setSegStart(e.target.value)}
                          placeholder={segType === 'percent' ? '0' : '1'}
                          min={segType === 'percent' ? 0 : 1}
                          max={segType === 'percent' ? 100 : undefined}
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          type="number"
                          value={segEnd}
                          onChange={(e) => setSegEnd(e.target.value)}
                          placeholder={segType === 'percent' ? '100' : ''}
                          min={segType === 'percent' ? 0 : 1}
                          max={segType === 'percent' ? 100 : undefined}
                        />
                      </Field>
                    </HStack>
                  </>
                )}

                <Field label="Due Date">
                  <Input
                    type="date"
                    value={segDueDate}
                    onChange={(e) => setSegDueDate(e.target.value)}
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setShowAddSegment(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="accent"
                  onClick={handleSaveSegment}
                  disabled={!segLabel.trim() || segSaving}
                >
                  {segSaving ? 'Saving...' : editingSegment ? 'Save Changes' : 'Add Assignment'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Delete Segment Confirmation ──────────────────────── */}
      <DialogRoot open={!!deleteSegmentRkey} onOpenChange={(e) => { if (!e.open) setDeleteSegmentRkey(null); }}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Assignment</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>
                Are you sure you want to delete this assignment? All discussion and progress records for it will also be removed. This cannot be undone.
              </Text>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setDeleteSegmentRkey(null)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeleteSegment}
                  disabled={deletingSegment}
                >
                  {deletingSegment ? 'Deleting...' : 'Delete Assignment'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Container>
  );
}
