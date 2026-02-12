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
import { MediaSearch, type MediaSearchResult } from '../components/MediaSearch';

interface CollectionPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface ListDetail {
  uri: string;
  rkey: string;
  name: string;
  description?: string;
  purpose?: string;
  segmentType?: string;
  createdBy: string;
  createdAt: string;
}

interface ListItem {
  uri: string;
  rkey: string;
  title: string;
  creator?: string;
  mediaItemId?: number;
  mediaType: string;
  order: number;
  addedBy: string;
  status: string;
  createdAt: string;
}

interface GroupListDetailPageProps {
  apiUrl: string;
}

const purposeLabels: Record<string, string> = {
  'book-club': '📚 Book Club',
  watchlist: '🎬 Watchlist',
  playlist: '🎵 Playlist',
  general: '📋 General',
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

const statusColors: Record<string, string> = {
  'not-started': 'gray',
  'in-progress': 'blue',
  completed: 'green',
  dropped: 'red',
};

const statusLabels: Record<string, string> = {
  'not-started': 'Not Started',
  'in-progress': 'In Progress',
  completed: 'Completed',
  dropped: 'Dropped',
};

export function GroupListDetailPage({ apiUrl }: GroupListDetailPageProps) {
  const { groupDid, listRkey } = useParams<{
    groupDid: string;
    listRkey: string;
  }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [list, setList] = useState<ListDetail | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [permissions, setPermissions] = useState<Record<string, CollectionPermission>>({});

  // Edit List state
  const [showEditList, setShowEditList] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editSegmentType, setEditSegmentType] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete List state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add Item state
  const [showAddItem, setShowAddItem] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Change Status state
  const [statusItemRkey, setStatusItemRkey] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  // Remove Item state
  const [removeItemRkey, setRemoveItemRkey] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState(false);

  const fetchListDetails = useCallback(async () => {
    try {
      const [listRes, groupRes] = await Promise.all([
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}`,
          { credentials: 'include' }
        ),
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid!)}`,
          { credentials: 'include' }
        ),
      ]);

      if (!listRes.ok) {
        if (listRes.status === 404) {
          throw new Error('List not found');
        }
        if (listRes.status === 403) {
          throw new Error('You must be a member of this group to view this list');
        }
        throw new Error('Failed to load list details');
      }

      const data = await listRes.json();
      setList(data.list);
      setItems(data.items || []);

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setPermissions(groupData.permissions || {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, groupDid, listRkey]);

  useEffect(() => {
    if (groupDid && listRkey) {
      fetchListDetails();
    }
  }, [fetchListDetails, groupDid, listRkey]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleEditList = async () => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName,
            description: editDescription || undefined,
            purpose: editPurpose || undefined,
            segmentType: editSegmentType || undefined,
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to update list');
      setShowEditList(false);
      await fetchListDetails();
    } catch (err) {
      console.error('Failed to update list:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteList = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to delete list');
      navigate(`/groups/${encodeURIComponent(groupDid!)}`);
    } catch (err) {
      console.error('Failed to delete list:', err);
      setDeleting(false);
    }
  };

  const handleAddItem = async (result: MediaSearchResult) => {
    setAddingItem(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}/items`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: result.title,
            creator: result.author || undefined,
            mediaItemId: result.mediaItemId || undefined,
            mediaType: result.mediaType || 'book',
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to add item');
      setShowAddItem(false);
      await fetchListDetails();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!statusItemRkey || !statusValue) return;
    setStatusSaving(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/items/${encodeURIComponent(statusItemRkey)}/status`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: statusValue }),
        }
      );
      if (!res.ok) throw new Error('Failed to change status');
      setStatusItemRkey(null);
      await fetchListDetails();
    } catch (err) {
      console.error('Failed to change status:', err);
    } finally {
      setStatusSaving(false);
    }
  };

  const handleRemoveItem = async () => {
    if (!removeItemRkey) return;
    setRemovingItem(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/items/${encodeURIComponent(removeItemRkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to remove item');
      setRemoveItemRkey(null);
      await fetchListDetails();
    } catch (err) {
      console.error('Failed to remove item:', err);
    } finally {
      setRemovingItem(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.solid" />
            <Text color="fg.muted">Loading list...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error || !list) {
    return (
      <Container maxW="4xl" py={8}>
        <EmptyState
          icon="😕"
          title={error || 'List not found'}
          description="This list may not exist or you may need to join the group first."
        />
        <Center mt={6}>
          <Button
            variant="outline"
            onClick={() =>
              navigate(`/groups/${encodeURIComponent(groupDid!)}`)
            }
          >
            ← Back to Group
          </Button>
        </Center>
      </Container>
    );
  }

  const listPerm = permissions['app.collectivesocial.group.list'];
  const itemPerm = permissions['app.collectivesocial.group.listitem'];
  const statusPerm = permissions['app.collectivesocial.group.listitem.status'];
  const segmentPerm = permissions['app.collectivesocial.group.segment'];

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const inProgressCount = items.filter(
    (i) => i.status === 'in-progress'
  ).length;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() =>
            navigate(`/groups/${encodeURIComponent(groupDid!)}`)
          }
          color="fg.muted"
          _hover={{ color: 'fg.default' }}
        >
          ← Back to Group
        </Button>

        {/* List Header */}
        <Box
          bg="bg.card"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.card"
          p={6}
        >
          <Flex justify="space-between" align="start">
            <Box flex="1">
              <HStack gap={2} mb={2} flexWrap="wrap">
                <Heading size="xl" fontFamily="heading">
                  {list.name}
                </Heading>
                {list.purpose && (
                  <Badge variant="subtle" size="md">
                    {purposeLabels[list.purpose] || list.purpose}
                  </Badge>
                )}
                {list.segmentType && (
                  <Badge variant="outline" size="md" colorPalette="blue">
                    Tracks {list.segmentType}
                  </Badge>
                )}
              </HStack>

              {list.description && (
                <Text fontSize="md" color="fg.muted" mb={4}>
                  {list.description}
                </Text>
              )}

              <HStack gap={4} flexWrap="wrap">
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight="bold">
                    {items.length}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {items.length === 1 ? 'item' : 'items'}
                  </Text>
                </HStack>
                {inProgressCount > 0 && (
                  <HStack gap={1}>
                    <Text fontSize="sm" fontWeight="bold" color="blue.solid">
                      {inProgressCount}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      in progress
                    </Text>
                  </HStack>
                )}
                {completedCount > 0 && (
                  <HStack gap={1}>
                    <Text fontSize="sm" fontWeight="bold" color="green.solid">
                      {completedCount}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      completed
                    </Text>
                  </HStack>
                )}
                <Text fontSize="xs" color="fg.subtle">
                  Created {new Date(list.createdAt).toLocaleDateString()}
                </Text>
              </HStack>
            </Box>

            {/* List-level actions (edit/delete) based on permissions */}
            <HStack gap={2}>
              {listPerm?.canUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="accent"
                  onClick={() => {
                    setEditName(list.name);
                    setEditDescription(list.description || '');
                    setEditPurpose(list.purpose || '');
                    setEditSegmentType(list.segmentType || '');
                    setShowEditList(true);
                  }}
                >
                  Edit List
                </Button>
              )}
              {listPerm?.canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete List
                </Button>
              )}
            </HStack>
          </Flex>
        </Box>

        {/* Items List */}
        <Box>
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" fontFamily="heading">
              Items
            </Heading>
            {itemPerm?.canCreate && (
              <Button
                size="sm"
                colorPalette="accent"
                variant="outline"
                onClick={() => setShowAddItem(true)}
              >
                + Add Item
              </Button>
            )}
          </Flex>
          {items.length > 0 ? (
            <VStack gap={3} align="stretch">
              {items.map((item, index) => (
                <Box
                  key={item.rkey}
                  bg="bg.card"
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor="border.card"
                  p={4}
                  cursor={item.rkey ? 'pointer' : 'default'}
                  transition="all 0.2s"
                  _hover={
                    item.rkey
                      ? { shadow: 'sm', transform: 'translateY(-1px)' }
                      : {}
                  }
                  onClick={() => {
                    if (item.rkey) {
                      navigate(`/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}/items/${encodeURIComponent(item.rkey)}`);
                    }
                  }}
                >
                  <Flex align="center" gap={3}>
                    {/* Order number */}
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="fg.subtle"
                      minW="24px"
                      textAlign="center"
                    >
                      {index + 1}
                    </Text>

                    {/* Media type icon */}
                    <Text fontSize="2xl">
                      {mediaTypeEmoji[item.mediaType] || '📄'}
                    </Text>

                    {/* Item details */}
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm">
                        {item.title}
                      </Text>
                      {item.creator && (
                        <Text fontSize="xs" color="fg.muted">
                          by {item.creator}
                        </Text>
                      )}
                    </Box>

                    {/* Status badge */}
                    <HStack gap={2}>
                      <Badge
                        colorPalette={statusColors[item.status] || 'gray'}
                        size="sm"
                      >
                        {statusLabels[item.status] || item.status}
                      </Badge>
                      {statusPerm?.canUpdate && (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusItemRkey(item.rkey);
                            setStatusValue(item.status);
                          }}
                        >
                          Change Status
                        </Button>
                      )}
                      {itemPerm?.canDelete && (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveItemRkey(item.rkey);
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          ) : (
            <EmptyState
              icon="📋"
              title="No items yet"
              description="This list doesn't have any items yet."
            />
          )}
        </Box>
      </VStack>

      {/* ── Edit List Dialog ─────────────────────────────────── */}
      <DialogRoot open={showEditList} onOpenChange={(e) => setShowEditList(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Field label="Name">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="List name"
                    autoFocus
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </Field>
                <Field label="Purpose">
                  <Box
                    as="select"
                    value={editPurpose}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditPurpose(e.target.value)}
                    w="100%"
                    p="0.5rem 0.75rem"
                    bg="bg.subtle"
                    borderWidth="1px"
                    borderColor="border.card"
                    borderRadius="md"
                    fontSize="sm"
                    color="fg.default"
                  >
                    <option value="">None</option>
                    <option value="book-club">📚 Book Club</option>
                    <option value="watchlist">🎬 Watchlist</option>
                    <option value="playlist">🎵 Playlist</option>
                    <option value="general">📋 General</option>
                  </Box>
                </Field>
                <Field label="Segment Type">
                  <Input
                    value={editSegmentType}
                    onChange={(e) => setEditSegmentType(e.target.value)}
                    placeholder="e.g. chapters, episodes"
                  />
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setShowEditList(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="accent"
                  onClick={handleEditList}
                  disabled={!editName.trim() || editSaving}
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Delete List Confirmation ─────────────────────────── */}
      <DialogRoot open={showDeleteConfirm} onOpenChange={(e) => setShowDeleteConfirm(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete List</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>
                Are you sure you want to delete <strong>{list?.name}</strong>? This will also remove
                all {items.length} {items.length === 1 ? 'item' : 'items'} in the list. This action
                cannot be undone.
              </Text>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleDeleteList}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete List'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Add Item Dialog ──────────────────────────────────── */}
      <DialogRoot open={showAddItem} onOpenChange={(e) => setShowAddItem(e.open)} size="lg">
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Item to {list?.name}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              {addingItem ? (
                <Center py={8}>
                  <VStack gap={3}>
                    <Spinner size="lg" color="accent.solid" />
                    <Text color="fg.muted">Adding item...</Text>
                  </VStack>
                </Center>
              ) : (
                <MediaSearch apiUrl={apiUrl} onSelect={handleAddItem} />
              )}
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" bg="transparent" onClick={() => setShowAddItem(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Change Status Dialog ─────────────────────────────── */}
      <DialogRoot open={!!statusItemRkey} onOpenChange={(e) => { if (!e.open) setStatusItemRkey(null); }}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Status</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Field label="Status">
                <Box
                  as="select"
                  value={statusValue}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusValue(e.target.value)}
                  w="100%"
                  p="0.5rem 0.75rem"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.card"
                  borderRadius="md"
                  fontSize="sm"
                  color="fg.default"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped</option>
                </Box>
              </Field>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setStatusItemRkey(null)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="blue"
                  onClick={handleChangeStatus}
                  disabled={statusSaving}
                >
                  {statusSaving ? 'Saving...' : 'Update Status'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Remove Item Confirmation ─────────────────────────── */}
      <DialogRoot open={!!removeItemRkey} onOpenChange={(e) => { if (!e.open) setRemoveItemRkey(null); }}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Item</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>
                Are you sure you want to remove this item from the list? This action cannot be undone.
              </Text>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setRemoveItemRkey(null)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="red"
                  onClick={handleRemoveItem}
                  disabled={removingItem}
                >
                  {removingItem ? 'Removing...' : 'Remove Item'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Container>
  );
}
