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
  Table,
  Input,
  IconButton,
} from '@chakra-ui/react';
import { LuMerge, LuX, LuPencil } from 'react-icons/lu';
import { DialogRoot, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogBackdrop, DialogPositioner, DialogCloseTrigger } from '../../components/ui/dialog';
import { AdminLayout } from '../../components/AdminLayout';

interface Tag {
  id: number;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  itemCount: number;
  userCount: number;
}

interface AffectedItem {
  id: number;
  title: string;
  creator: string | null;
  media_type: string;
  user_did: string;
}

interface MergePreview {
  affectedItems: AffectedItem[];
  duplicateCount: number;
  duplicates: Array<{ media_item_id: number; user_did: string }>;
}

interface AdminTagsPageProps {
  apiUrl: string;
}

export function AdminTagsPage({ apiUrl }: AdminTagsPageProps) {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceTag, setSourceTag] = useState<Tag | null>(null);
  const [targetTag, setTargetTag] = useState<Tag | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [merging, setMerging] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editedName, setEditedName] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const fetchTags = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/tags`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch tags, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        navigate('/');
        return;
      }

      const data = await response.json();
      setTags(data.tags);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      navigate('/');
    }
  };

  useEffect(() => {
    fetchTags();
  }, [apiUrl]);

  // Filter tags based on search query
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredTags(tags);
      } else {
        const query = searchQuery.toLowerCase();
        setFilteredTags(
          tags.filter(
            (tag) =>
              tag.name.toLowerCase().includes(query) ||
              tag.slug.toLowerCase().includes(query)
          )
        );
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, tags]);

  const openMergeModal = (tag: Tag) => {
    setSourceTag(tag);
    setTargetTag(null);
    setMergePreview(null);
    setMergeModalOpen(true);
  };

  const loadMergePreview = async () => {
    if (!sourceTag || !targetTag) return;

    setLoadingPreview(true);
    try {
      const response = await fetch(
        `${apiUrl}/admin/tags/merge-preview?sourceTagId=${sourceTag.id}&targetTagId=${targetTag.id}`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMergePreview(data);
      }
    } catch (err) {
      console.error('Failed to load merge preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (sourceTag && targetTag) {
      loadMergePreview();
    }
  }, [sourceTag, targetTag]);

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setEditedName(tag.name);
    setEditModalOpen(true);
  };

  const handleEdit = async () => {
    if (!editingTag || !editedName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`${apiUrl}/admin/tags/${editingTag.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName.trim(),
        }),
      });

      if (response.ok) {
        alert('Tag updated successfully!');
        setEditModalOpen(false);
        fetchTags(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to update tag: ${error.error}`);
      }
    } catch (err) {
      console.error('Failed to update tag:', err);
      alert('Failed to update tag');
    } finally {
      setSaving(false);
    }
  };

  const handleMerge = async () => {
    if (!sourceTag || !targetTag) return;

    setMerging(true);
    try {
      const response = await fetch(`${apiUrl}/admin/tags/merge`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceTagId: sourceTag.id,
          targetTagId: targetTag.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully merged! ${data.rowsUpdated} records updated.`);
        setMergeModalOpen(false);
        fetchTags(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to merge: ${error.error}`);
      }
    } catch (err) {
      console.error('Failed to merge tags:', err);
      alert('Failed to merge tags');
    } finally {
      setMerging(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="teal.500" />
            <Text color="fg.muted">Loading tags...</Text>
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
          <Heading size={{ base: 'xl', md: '2xl' }}>Tags</Heading>
          <Badge colorPalette="gray" size="lg" px={4} py={2}>
            Total: {tags.length}
          </Badge>
        </Flex>

        <Box mb={4}>
          <Input
            placeholder="Search tags by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                  Name
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  display={{ base: 'none', md: 'table-cell' }}
                >
                  Slug
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                >
                  Items
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                  display={{ base: 'none', lg: 'table-cell' }}
                >
                  Users
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                >
                  Status
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                >
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredTags.map((tag) => (
                <Table.Row key={tag.id}>
                  <Table.Cell fontSize="sm" fontWeight="medium">
                    {tag.name}
                  </Table.Cell>
                  <Table.Cell
                    fontSize="sm"
                    fontFamily="mono"
                    color="fg.muted"
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    {tag.slug}
                  </Table.Cell>
                  <Table.Cell textAlign="center" fontSize="sm">
                    {tag.itemCount}
                  </Table.Cell>
                  <Table.Cell
                    textAlign="center"
                    fontSize="sm"
                    display={{ base: 'none', lg: 'table-cell' }}
                  >
                    {tag.userCount}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Badge
                      colorPalette={
                        tag.status === 'active'
                          ? 'green'
                          : tag.status === 'merged'
                          ? 'gray'
                          : 'red'
                      }
                      size="sm"
                      textTransform="capitalize"
                    >
                      {tag.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <HStack gap={2} justify="center">
                      {tag.status === 'active' && (
                        <>
                          <IconButton
                            size="sm"
                            variant="outline"
                            colorPalette="blue"
                            bg="transparent"
                            onClick={() => openEditModal(tag)}
                            aria-label="Edit tag"
                          >
                            <LuPencil />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="outline"
                            colorPalette="teal"
                            bg="transparent"
                            onClick={() => openMergeModal(tag)}
                            aria-label="Merge tag"
                          >
                            <LuMerge />
                          </IconButton>
                        </>
                      )}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {filteredTags.length === 0 && (
          <Center py={8}>
            <Text color="fg.muted">No tags found</Text>
          </Center>
        )}
      </Box>

      {/* Merge Modal */}
      <DialogRoot
        open={mergeModalOpen}
        onOpenChange={(e) => setMergeModalOpen(e.open)}
        size="xl"
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Merge Tags</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <VStack gap={6} align="stretch">
                <Box>
                  <Text fontSize="sm" mb={4}>
                    Select a target tag to merge <strong>{sourceTag?.name}</strong> into.
                    All items tagged with the source will be updated to use the target tag.
                  </Text>
                </Box>

                <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
                  {/* Source Tag */}
                  <Box
                    flex="1"
                    p={4}
                    borderWidth="2px"
                    borderColor="red.500"
                    borderRadius="md"
                    bg="bg.subtle"
                  >
                    <Text fontSize="xs" fontWeight="bold" color="red.500" mb={2}>
                      SOURCE (will be merged away)
                    </Text>
                    {sourceTag && (
                      <>
                        <Heading size="md" mb={2}>
                          {sourceTag.name}
                        </Heading>
                        <Text fontSize="sm" color="fg.muted" fontFamily="mono" mb={3}>
                          {sourceTag.slug}
                        </Text>
                        <HStack gap={4}>
                          <Box>
                            <Text fontSize="xs" color="fg.muted">
                              Items
                            </Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {sourceTag.itemCount}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="fg.muted">
                              Users
                            </Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {sourceTag.userCount}
                            </Text>
                          </Box>
                        </HStack>
                      </>
                    )}
                  </Box>

                  {/* Target Tag */}
                  <Box
                    flex="1"
                    p={4}
                    borderWidth="2px"
                    borderColor={targetTag ? 'green.500' : 'border'}
                    borderRadius="md"
                    bg="bg.subtle"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color={targetTag ? 'green.500' : 'fg.muted'}
                      mb={2}
                    >
                      TARGET (will keep this tag)
                    </Text>
                    {targetTag ? (
                      <>
                        <Flex justify="space-between" align="start" mb={2}>
                          <Heading size="md">{targetTag.name}</Heading>
                          <Button
                            size="xs"
                            variant="ghost"
                            bg="transparent"
                            onClick={() => setTargetTag(null)}
                          >
                            <LuX />
                          </Button>
                        </Flex>
                        <Text fontSize="sm" color="fg.muted" fontFamily="mono" mb={3}>
                          {targetTag.slug}
                        </Text>
                        <HStack gap={4}>
                          <Box>
                            <Text fontSize="xs" color="fg.muted">
                              Items
                            </Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {targetTag.itemCount}
                            </Text>
                          </Box>
                          <Box>
                            <Text fontSize="xs" color="fg.muted">
                              Users
                            </Text>
                            <Text fontSize="lg" fontWeight="bold">
                              {targetTag.userCount}
                            </Text>
                          </Box>
                        </HStack>
                      </>
                    ) : (
                      <Box>
                        <Text fontSize="sm" color="fg.muted" mb={3}>
                          Select a target tag from the list below
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Flex>

                {/* Target Tag Selection */}
                {!targetTag && (
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Select Target Tag:
                    </Text>
                    <Box maxH="300px" overflowY="auto" borderWidth="1px" borderRadius="md">
                      {tags
                        .filter(
                          (t) => t.id !== sourceTag?.id && t.status === 'active'
                        )
                        .map((tag) => (
                          <Flex
                            key={tag.id}
                            p={3}
                            borderBottomWidth="1px"
                            _last={{ borderBottomWidth: 0 }}
                            cursor="pointer"
                            _hover={{ bg: 'bg.muted' }}
                            onClick={() => setTargetTag(tag)}
                            justify="space-between"
                            align="center"
                          >
                            <Box>
                              <Text fontWeight="medium">{tag.name}</Text>
                              <Text fontSize="xs" color="fg.muted">
                                {tag.slug}
                              </Text>
                            </Box>
                            <HStack gap={3}>
                              <Badge size="sm">{tag.itemCount} items</Badge>
                              <Badge size="sm">{tag.userCount} users</Badge>
                            </HStack>
                          </Flex>
                        ))}
                    </Box>
                  </Box>
                )}

                {/* Merge Preview */}
                {targetTag && (
                  <Box
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="bg.muted"
                  >
                    <Text fontSize="sm" fontWeight="bold" mb={3}>
                      Merge Preview
                    </Text>
                    {loadingPreview ? (
                      <Center py={4}>
                        <Spinner size="sm" />
                      </Center>
                    ) : mergePreview ? (
                      <VStack align="stretch" gap={2}>
                        <Flex justify="space-between" fontSize="sm">
                          <Text>Items to update:</Text>
                          <Text fontWeight="bold">
                            {mergePreview.affectedItems.length}
                          </Text>
                        </Flex>
                        <Flex justify="space-between" fontSize="sm">
                          <Text>Duplicate entries to remove:</Text>
                          <Text fontWeight="bold" color="orange.500">
                            {mergePreview.duplicateCount}
                          </Text>
                        </Flex>
                        {mergePreview.duplicateCount > 0 && (
                          <Text fontSize="xs" color="fg.muted">
                            These are items where a user has tagged the same item with
                            both tags. The duplicate will be automatically removed.
                          </Text>
                        )}
                      </VStack>
                    ) : null}
                  </Box>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                bg="transparent"
                onClick={() => setMergeModalOpen(false)}
                mr={3}
              >
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                onClick={handleMerge}
                bg="transparent"
                disabled={!targetTag || merging || loadingPreview}
              >
                {merging ? 'Merging...' : 'Merge Tags'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* Edit Tag Modal */}
      <DialogRoot open={editModalOpen} onOpenChange={(e) => setEditModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogCloseTrigger bg="transparent">
                <LuX />
              </DialogCloseTrigger>
            </DialogHeader>
            <DialogBody>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Tag Name
                  </Text>
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter tag name"
                    maxLength={36}
                  />
                  <Text fontSize="xs" color="fg.muted" mt={2}>
                    The tag will be automatically converted to lowercase and trimmed. Maximum 36 characters.
                  </Text>
                </Box>
                {editingTag && (
                  <Box p={3} bg="bg.muted" borderRadius="md">
                    <Text fontSize="sm" color="fg.muted" mb={1}>
                      Current: <strong>{editingTag.name}</strong>
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      Slug: <Text as="span" fontFamily="mono">{editingTag.slug}</Text>
                    </Text>
                    <Text fontSize="sm" color="fg.muted" mt={2}>
                      Used on {editingTag.itemCount} {editingTag.itemCount === 1 ? 'item' : 'items'} by {editingTag.userCount} {editingTag.userCount === 1 ? 'user' : 'users'}
                    </Text>
                  </Box>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button
                variant="outline"
                bg="transparent"
                onClick={() => setEditModalOpen(false)}
                mr={3}
              >
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                variant="solid"
                onClick={handleEdit}
                disabled={!editedName.trim() || saving || editedName.trim().toLowerCase() === editingTag?.name}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </AdminLayout>
  );
}
