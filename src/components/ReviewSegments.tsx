import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Textarea,
  VStack,
  HStack,
  IconButton,
  Input,
  Heading,
} from '@chakra-ui/react';
import { Field } from './ui/field';
import { LuPlus, LuPencil, LuTrash2, LuX, LuCheck } from 'react-icons/lu';
import { Progress } from '@chakra-ui/react';

interface ReviewSegment {
  uri: string;
  cid: string;
  value: {
    text: string;
    percentage: number;
    title?: string;
    mediaItemId?: number;
    mediaType?: string;
    listItem?: string;
    createdAt: string;
  };
}

interface ReviewSegmentsProps {
  listItemUri: string;
  mediaItemId: number | null;
  mediaType: string | null;
  itemLength: number | null;
  apiUrl: string;
  onSegmentChange?: () => void;
}

export function ReviewSegments({
  listItemUri,
  mediaItemId,
  mediaType,
  itemLength,
  apiUrl,
  onSegmentChange,
}: ReviewSegmentsProps) {
  const [segments, setSegments] = useState<ReviewSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUri, setEditingUri] = useState<string | null>(null);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newPercentage, setNewPercentage] = useState<number>(0);
  const [newLengthProgress, setNewLengthProgress] = useState<number>(0);
  const [useLength, setUseLength] = useState(false);

  // Calculate highest percentage for progress bar
  const highestPercentage = segments.length > 0
    ? Math.max(...segments.map(s => s.value.percentage))
    : 0;

  useEffect(() => {
    fetchSegments();
  }, [mediaItemId, listItemUri]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      // Prefer fetching by mediaItemId so segments are shared across lists
      let response;
      if (mediaItemId) {
        response = await fetch(`${apiUrl}/reviewsegments/media/${mediaItemId}`, {
          credentials: 'include',
        });
      } else {
        const encodedUri = encodeURIComponent(listItemUri);
        response = await fetch(`${apiUrl}/reviewsegments/list/${encodedUri}`, {
          credentials: 'include',
        });
      }

      if (response.ok) {
        const data = await response.json();
        setSegments(data.segments || []);
      }
    } catch (err) {
      console.error('Failed to fetch review segments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSegment = async () => {
    const percentage = useLength && itemLength
      ? Math.round((newLengthProgress / itemLength) * 100)
      : newPercentage;

    if (percentage < 0 || percentage > 100) {
      alert('Percentage must be between 0 and 100');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/reviewsegments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: newText.trim() || undefined,
          percentage,
          title: newTitle.trim() || undefined,
          mediaItemId: mediaItemId || undefined,
          mediaType: mediaType || undefined,
          listItem: listItemUri,
        }),
      });

      if (response.ok) {
        setNewTitle('');
        setNewText('');
        setNewPercentage(0);
        setNewLengthProgress(0);
        setIsAdding(false);
        fetchSegments();
        onSegmentChange?.();
      } else {
        alert('Failed to add review segment');
      }
    } catch (err) {
      console.error('Failed to add review segment:', err);
      alert('Failed to add review segment');
    }
  };

  const handleUpdateSegment = async (segment: ReviewSegment) => {
    const percentage = useLength && itemLength
      ? Math.round((newLengthProgress / itemLength) * 100)
      : newPercentage;

    if (percentage < 0 || percentage > 100) {
      alert('Percentage must be between 0 and 100');
      return;
    }

    try {
      const encodedUri = encodeURIComponent(segment.uri);
      const response = await fetch(`${apiUrl}/reviewsegments/${encodedUri}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text: newText.trim() || undefined,
          percentage,
          title: newTitle.trim() || undefined,
        }),
      });

      if (response.ok) {
        setEditingUri(null);
        setNewTitle('');
        setNewText('');
        setNewPercentage(0);
        setNewLengthProgress(0);
        fetchSegments();
        onSegmentChange?.();
      } else {
        alert('Failed to update review segment');
      }
    } catch (err) {
      console.error('Failed to update review segment:', err);
      alert('Failed to update review segment');
    }
  };

  const handleDeleteSegment = async (segmentUri: string) => {
    if (!confirm('Are you sure you want to delete this review segment?')) {
      return;
    }

    try {
      const encodedUri = encodeURIComponent(segmentUri);
      const response = await fetch(`${apiUrl}/reviewsegments/${encodedUri}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchSegments();
        onSegmentChange?.();
      } else {
        alert('Failed to delete review segment');
      }
    } catch (err) {
      console.error('Failed to delete review segment:', err);
      alert('Failed to delete review segment');
    }
  };

  const startEditing = (segment: ReviewSegment) => {
    setEditingUri(segment.uri);
    setNewTitle(segment.value.title || '');
    setNewText(segment.value.text);
    setNewPercentage(segment.value.percentage);
    if (itemLength) {
      setNewLengthProgress(Math.round((segment.value.percentage / 100) * itemLength));
    }
  };

  const cancelEditing = () => {
    setEditingUri(null);
    setNewTitle('');
    setNewText('');
    setNewPercentage(0);
    setNewLengthProgress(0);
  };

  const getLengthUnit = () => {
    switch (mediaType) {
      case 'book':
        return 'pages';
      case 'movie':
        return 'minutes';
      case 'tv':
        return 'episodes';
      case 'podcast':
        return 'minutes';
      case 'course':
        return 'modules';
      default:
        return 'units';
    }
  };

  if (loading) {
    return (
      <Box>
        <Text color="fg.muted" fontSize="sm">Loading progress...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" justify="space-between" mb={3}>
        <Heading size="sm" fontFamily="heading">Progress</Heading>
        {!isAdding && (
          <IconButton
            aria-label="Add review progress"
            bg="transparent"
            size="sm"
            variant="outline"
            colorPalette="accent"
            onClick={() => setIsAdding(true)}
          >
            <LuPlus />
          </IconButton>
        )}
      </Flex>

      {/* Progress Bar */}
      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium">
            Overall Progress
          </Text>
          <Text fontSize="sm" color="accent.default" fontWeight="bold">
            {highestPercentage}%
          </Text>
        </Flex>
        <Progress.Root value={highestPercentage} max={100} colorPalette="accent">
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        {itemLength && (
          <Text fontSize="xs" color="fg.muted" mt={1}>
            ~{Math.round((highestPercentage / 100) * itemLength)} of {itemLength} {getLengthUnit()}
          </Text>
        )}
      </Box>

      {/* Add New Segment Form */}
      {isAdding && (
        <Box
          bg="bg.subtle"
          borderRadius="md"
          p={4}
          mb={4}
          borderWidth="1px"
          borderColor="accent.default"
        >
          <VStack gap={3} align="stretch">
            <Field label="Title (optional)">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Chapter 5 thoughts"
                size="sm"
              />
            </Field>

            <Field label="Your thoughts (optional)">
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Share your thoughts at this point..."
                rows={3}
                size="sm"
              />
            </Field>

            <Field label="Progress">
              {itemLength ? (
                <VStack gap={2} align="stretch">
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant={useLength ? 'solid' : 'outline'}
                      colorPalette="accent"
                      bg="transparent"
                      onClick={() => setUseLength(true)}
                    >
                      By {getLengthUnit()}
                    </Button>
                    <Button
                      size="xs"
                      variant={!useLength ? 'solid' : 'outline'}
                      colorPalette="accent"
                      bg="transparent"
                      onClick={() => setUseLength(false)}
                    >
                      By Percentage
                    </Button>
                  </HStack>
                  
                  {useLength ? (
                    <HStack gap={2}>
                      <Input
                        type="number"
                        value={newLengthProgress}
                        onChange={(e) => setNewLengthProgress(Number(e.target.value))}
                        min={0}
                        max={itemLength}
                        size="sm"
                      />
                      <Text fontSize="sm" color="fg.muted">
                        of {itemLength} {getLengthUnit()} (~
                        {Math.round((newLengthProgress / itemLength) * 100)}%)
                      </Text>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <Input
                        type="number"
                        value={newPercentage}
                        onChange={(e) => setNewPercentage(Number(e.target.value))}
                        min={0}
                        max={100}
                        size="sm"
                      />
                      <Text fontSize="sm" color="fg.muted">
                        % complete
                      </Text>
                    </HStack>
                  )}
                </VStack>
              ) : (
                <HStack gap={2}>
                  <Input
                    type="number"
                    value={newPercentage}
                    onChange={(e) => setNewPercentage(Number(e.target.value))}
                    min={0}
                    max={100}
                    size="sm"
                  />
                  <Text fontSize="sm" color="fg.muted">
                    % complete
                  </Text>
                </HStack>
              )}
            </Field>

            <HStack justify="flex-end" gap={2}>
              <Button
                size="sm"
                variant="outline"
                bg="transparent"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                  setNewText('');
                  setNewPercentage(0);
                  setNewLengthProgress(0);
                }}
              >
                <LuX /> Cancel
              </Button>
              <Button
                size="sm"
                colorPalette="accent"
                variant="outline"
                bg="transparent"
                onClick={handleAddSegment}
              >
                <LuCheck /> Add Progress
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Existing Segments */}
      {segments.length > 0 && (
        <VStack gap={3} align="stretch">
          {segments.map((segment) => (
            <Box
              key={segment.uri}
              bg="bg.subtle"
              borderRadius="md"
              p={3}
              borderWidth="1px"
              borderColor="border.card"
            >
              {editingUri === segment.uri ? (
                <VStack gap={3} align="stretch">
                  <Field label="Title (optional)">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Chapter 5 thoughts"
                      size="sm"
                    />
                  </Field>

                  <Field label="Your thoughts (optional)">
                    <Textarea
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      rows={3}
                      size="sm"
                    />
                  </Field>

                  <Field label="Progress">
                    {itemLength ? (
                      <VStack gap={2} align="stretch">
                        <HStack gap={2}>
                          <Button
                            size="xs"
                            variant={useLength ? 'solid' : 'outline'}
                            colorPalette="accent"
                            bg="transparent"
                            onClick={() => setUseLength(true)}
                          >
                            By {getLengthUnit()}
                          </Button>
                          <Button
                            size="xs"
                            variant={!useLength ? 'solid' : 'outline'}
                            colorPalette="accent"
                            bg="transparent"
                            onClick={() => setUseLength(false)}
                          >
                            By Percentage
                          </Button>
                        </HStack>
                        
                        {useLength ? (
                          <HStack gap={2}>
                            <Input
                              type="number"
                              value={newLengthProgress}
                              onChange={(e) => setNewLengthProgress(Number(e.target.value))}
                              min={0}
                              max={itemLength}
                              size="sm"
                            />
                            <Text fontSize="sm" color="fg.muted">
                              of {itemLength} {getLengthUnit()} (~
                              {Math.round((newLengthProgress / itemLength) * 100)}%)
                            </Text>
                          </HStack>
                        ) : (
                          <HStack gap={2}>
                            <Input
                              type="number"
                              value={newPercentage}
                              onChange={(e) => setNewPercentage(Number(e.target.value))}
                              min={0}
                              max={100}
                              size="sm"
                            />
                            <Text fontSize="sm" color="fg.muted">
                              % complete
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    ) : (
                      <HStack gap={2}>
                        <Input
                          type="number"
                          value={newPercentage}
                          onChange={(e) => setNewPercentage(Number(e.target.value))}
                          min={0}
                          max={100}
                          size="sm"
                        />
                        <Text fontSize="sm" color="fg.muted">
                          % complete
                        </Text>
                      </HStack>
                    )}
                  </Field>

                  <HStack justify="flex-end" gap={2}>
                    <Button size="sm" variant="outline" bg="transparent" onClick={cancelEditing}>
                      <LuX /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="accent"
                      variant="outline"
                      bg="transparent"
                      onClick={() => handleUpdateSegment(segment)}
                    >
                      <LuCheck /> Save
                    </Button>
                  </HStack>
                </VStack>
              ) : (
                <>
                  <Flex justify="space-between" align="flex-start" mb={2}>
                    <Box flex="1">
                      {segment.value.title && (
                        <Text fontWeight="medium" fontSize="sm" mb={1}>
                          {segment.value.title}
                        </Text>
                      )}
                      <Text fontSize="xs" color="accent.default" fontWeight="bold">
                        At {segment.value.percentage}%
                        {itemLength && (
                          <> (~{Math.round((segment.value.percentage / 100) * itemLength)} {getLengthUnit()})</>
                        )}
                      </Text>
                    </Box>
                    <HStack gap={1}>
                      <IconButton
                        aria-label="Edit segment"
                        size="xs"
                        variant="ghost"
                        bg="transparent"
                        onClick={() => startEditing(segment)}
                      >
                        <LuPencil />
                      </IconButton>
                      <IconButton
                        aria-label="Delete segment"
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        bg="transparent"
                        onClick={() => handleDeleteSegment(segment.uri)}
                      >
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Flex>
                  <Text fontSize="sm" lineHeight="1.6">
                    {segment.value.text}
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt={2}>
                    {new Date(segment.value.createdAt).toLocaleDateString()}
                  </Text>
                </>
              )}
            </Box>
          ))}
        </VStack>
      )}

      {segments.length === 0 && !isAdding && (
        <Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
          No progress yet. Click the + button to add your first one!
        </Text>
      )}
    </Box>
  );
}
