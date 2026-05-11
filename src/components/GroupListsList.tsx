import { useEffect, useState } from 'react';
import { Badge, Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { LuGripVertical } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import { toaster } from './ui/toaster';
import { setPostLoginRedirect } from '../utils/authRedirect';

export interface ReorderableGroupList {
  id: number;
  uri: string;
  rkey: string;
  name: string;
  description: string | null;
  purpose: string | null;
  segmentType: string | null;
  order?: number;
  item_count?: number;
}

interface GroupListsListProps {
  /** Lists in current display order. */
  lists: ReorderableGroupList[];
  /** Community DID, used for navigation + the reorder API call. */
  communityDid: string;
  apiUrl: string;
  /**
   * When true, the list becomes drag-and-drop reorderable and persists the
   * new order to the API. Should only be passed for group admins.
   */
  canReorder: boolean;
  purposeLabels: Record<string, string>;
  /**
   * Whether the current viewer is signed in. When false, clicking a list
   * card bounces the user through the login flow instead of opening the
   * (members-only) list detail page.
   */
  isAuthenticated?: boolean;
}

/**
 * Renders the group's lists. When `canReorder` is true, admins can drag list
 * cards to reorder them; the new order is persisted optimistically via
 * `PUT /groups/:did/lists/reorder` and rolled back on failure.
 */
export function GroupListsList({
  lists,
  communityDid,
  apiUrl,
  canReorder,
  purposeLabels,
  isAuthenticated = true,
}: GroupListsListProps) {
  const navigate = useNavigate();
  // Local copy so we can do optimistic reorders without waiting for a refetch.
  const [items, setItems] = useState<ReorderableGroupList[]>(lists);
  const [dragRkey, setDragRkey] = useState<string | null>(null);
  const [dragOverRkey, setDragOverRkey] = useState<string | null>(null);

  // Sync from parent whenever the upstream list changes (e.g. after a refetch
  // post create/delete). Drag state is reset to avoid stale highlighting.
  useEffect(() => {
    setItems(lists);
    setDragRkey(null);
    setDragOverRkey(null);
  }, [lists]);

  const persistOrder = async (next: ReorderableGroupList[]) => {
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(communityDid)}/lists/reorder`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: next.map(l => l.rkey) }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save new order');
      }
    } catch (err: any) {
      // Roll back optimistic update and surface the failure.
      setItems(lists);
      toaster.create({
        title: 'Couldn\u2019t save new order',
        description: err.message || 'Please try again.',
        type: 'error',
        duration: 4000,
      });
    }
  };

  const handleDrop = (targetRkey: string) => {
    if (!dragRkey || dragRkey === targetRkey) {
      setDragRkey(null);
      setDragOverRkey(null);
      return;
    }
    const fromIndex = items.findIndex(l => l.rkey === dragRkey);
    const toIndex = items.findIndex(l => l.rkey === targetRkey);
    if (fromIndex < 0 || toIndex < 0) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setItems(next);
    setDragRkey(null);
    setDragOverRkey(null);
    void persistOrder(next);
  };

  return (
    <VStack gap={3} align="stretch">
      {items.map(list => {
        const isDragging = dragRkey === list.rkey;
        const isDropTarget = dragOverRkey === list.rkey && dragRkey !== list.rkey;
        const itemCount = list.item_count ?? 0;

        return (
          <Box
            key={list.id}
            bg="bg.card"
            borderRadius="lg"
            borderWidth="1px"
            borderColor={isDropTarget ? 'accent.solid' : 'border.card'}
            p={4}
            cursor="pointer"
            opacity={isDragging ? 0.5 : 1}
            transition="all 0.2s"
            _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}
            draggable={canReorder}
            onDragStart={e => {
              if (!canReorder) return;
              setDragRkey(list.rkey);
              // Required for Firefox to fire drop events.
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', list.rkey);
            }}
            onDragEnd={() => {
              setDragRkey(null);
              setDragOverRkey(null);
            }}
            onDragOver={e => {
              if (!canReorder || !dragRkey) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverRkey !== list.rkey) setDragOverRkey(list.rkey);
            }}
            onDragLeave={() => {
              if (dragOverRkey === list.rkey) setDragOverRkey(null);
            }}
            onDrop={e => {
              if (!canReorder) return;
              e.preventDefault();
              handleDrop(list.rkey);
            }}
            onClick={() => {
              // Logged-out visitors can see that a list exists on the group
              // page, but actually viewing its contents requires membership.
              // Stash the group URL + a join hint and route them through
              // login.
              if (!isAuthenticated) {
                setPostLoginRedirect(`/groups/${encodeURIComponent(communityDid)}`, {
                  reason: 'Sign in to view this group\u2019s lists.',
                  joinGroupDid: communityDid,
                });
                toaster.create({
                  title: 'Sign in to continue',
                  description: 'Join this group to view its lists.',
                  type: 'info',
                  duration: 3500,
                });
                navigate('/');
                return;
              }
              navigate(
                `/groups/${encodeURIComponent(communityDid)}/lists/${encodeURIComponent(list.rkey)}`
              );
            }}
          >
            <Flex justify="space-between" align="start" gap={3}>
              <HStack gap={2} flex="1" minW={0} align="start">
                {canReorder && (
                  <Box
                    color="fg.subtle"
                    pt={1}
                    cursor="grab"
                    _active={{ cursor: 'grabbing' }}
                    aria-label="Drag to reorder"
                    flexShrink={0}
                  >
                    <LuGripVertical />
                  </Box>
                )}
                <Box flex="1" minW={0}>
                  <HStack gap={2} mb={1} flexWrap="wrap">
                    <Text fontWeight="semibold">{list.name}</Text>
                    {list.purpose && (
                      <Badge variant="subtle" size="sm">
                        {purposeLabels[list.purpose] || list.purpose}
                      </Badge>
                    )}
                    {list.segmentType && (
                      <Badge variant="outline" size="sm" colorPalette="blue">
                        Tracks {list.segmentType}
                      </Badge>
                    )}
                  </HStack>
                  {list.description && (
                    <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                      {list.description}
                    </Text>
                  )}
                </Box>
              </HStack>
              <Badge variant="subtle" size="sm" flexShrink={0}>
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Badge>
            </Flex>
          </Box>
        );
      })}
    </VStack>
  );
}
