import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  Textarea,
  VStack,
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
} from './ui/dialog';
import { Field } from './ui/field';

interface AddMediaModalProps {
  apiUrl: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (mediaItemId: number) => void;
}

export function AddMediaModal({
  apiUrl,
  open,
  onClose,
  onSuccess,
}: AddMediaModalProps) {
  const [mediaType, setMediaType] = useState<
    'book' | 'movie' | 'tv' | 'game' | 'music' | 'article' | 'video' | 'course'
  >('book');
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [isbn, setIsbn] = useState('');
  const [imdbId, setImdbId] = useState('');
  const [url, setUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [description, setDescription] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [length, setLength] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setMediaType('book');
    setTitle('');
    setCreator('');
    setIsbn('');
    setImdbId('');
    setUrl('');
    setCoverImage('');
    setDescription('');
    setPublishYear('');
    setLength('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/media/add`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          creator: creator.trim() || null,
          mediaType,
          isbn: isbn.trim() || null,
          imdbId: imdbId.trim() || null,
          url: url.trim() || null,
          coverImage: coverImage.trim() || null,
          description: description.trim() || null,
          publishYear: publishYear ? parseInt(publishYear) : null,
          length: length ? parseInt(length) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to add media item');
      }

      const data = await response.json();
      resetForm();
      onSuccess(data.mediaItemId);
    } catch (err) {
      console.error('Failed to add media item:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to add media item'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getLengthLabel = () => {
    switch (mediaType) {
      case 'book':
        return 'Page Count';
      case 'movie':
      case 'tv':
        return 'Runtime (minutes)';
      case 'course':
        return 'Number of Modules';
      default:
        return 'Length';
    }
  };

  const getCreatorLabel = () => {
    switch (mediaType) {
      case 'book':
        return 'Author';
      case 'movie':
      case 'tv':
        return 'Director/Creator';
      case 'game':
        return 'Developer';
      case 'music':
        return 'Artist';
      case 'course':
        return 'Instructor';
      default:
        return 'Creator';
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && handleClose()}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="600px">
          <DialogHeader>
            <DialogTitle>Add New Media Item</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              {error && (
                <Box
                  p={3}
                  bg="red.500/20"
                  borderWidth="1px"
                  borderColor="red.500"
                  borderRadius="md"
                  color="red.300"
                >
                  {error}
                </Box>
              )}

              <Field label="Media Type" required>
                <Box
                  as="select"
                  value={mediaType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setMediaType(
                      e.target.value as
                        | 'book'
                        | 'movie'
                        | 'tv'
                        | 'game'
                        | 'music'
                        | 'article'
                        | 'video'
                        | 'course'
                    )
                  }
                  w="100%"
                  p="0.5rem 0.75rem"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.card"
                  borderRadius="md"
                  fontSize="sm"
                  color="fg.default"
                >
                  <option value="book">Book</option>
                  <option value="movie">Movie</option>
                  <option value="tv">TV Show</option>
                  <option value="game">Game</option>
                  <option value="music">Music</option>
                  <option value="article">Article</option>
                  <option value="video">Video</option>
                  <option value="course">Course</option>
                </Box>
              </Field>

              <Field label="Title" required>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </Field>

              <Field label={getCreatorLabel()}>
                <Input
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder={`Enter ${getCreatorLabel().toLowerCase()}`}
                />
              </Field>

              {(mediaType === 'book' || mediaType === 'movie' || mediaType === 'tv') && (
                <HStack gap={4}>
                  {mediaType === 'book' && (
                    <Box flex={1}>
                      <Field label="ISBN">
                        <Input
                          value={isbn}
                          onChange={(e) => setIsbn(e.target.value)}
                          placeholder="Enter ISBN"
                        />
                      </Field>
                    </Box>
                  )}
                  {(mediaType === 'movie' || mediaType === 'tv') && (
                    <Box flex={1}>
                      <Field label="IMDB ID">
                        <Input
                          value={imdbId}
                          onChange={(e) => setImdbId(e.target.value)}
                          placeholder="tt1234567"
                        />
                      </Field>
                    </Box>
                  )}
                  <Box flex={1}>
                    <Field label="Year">
                      <Input
                        type="number"
                        value={publishYear}
                        onChange={(e) => setPublishYear(e.target.value)}
                        placeholder={new Date().getFullYear().toString()}
                        min="1800"
                        max={new Date().getFullYear() + 5}
                      />
                    </Field>
                  </Box>
                </HStack>
              )}

              {mediaType !== 'book' && mediaType !== 'movie' && mediaType !== 'tv' && (
                <HStack gap={4}>
                  <Box flex={2}>
                    <Field label="URL">
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </Field>
                  </Box>
                  <Box flex={1}>
                    <Field label="Year">
                      <Input
                        type="number"
                        value={publishYear}
                        onChange={(e) => setPublishYear(e.target.value)}
                        placeholder={new Date().getFullYear().toString()}
                        min="0"
                        max={new Date().getFullYear() + 5}
                      />
                    </Field>
                  </Box>
                </HStack>
              )}

              <HStack gap={4}>
                <Box flex={2}>
                  <Field label="Cover Image URL">
                    <Input
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      placeholder="https://..."
                    />
                  </Field>
                </Box>
                <Box flex={1}>
                  <Field label={getLengthLabel()}>
                    <Input
                      type="number"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </Field>
                </Box>
              </HStack>

              <Field label="Description">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  resize="vertical"
                />
              </Field>

              <Text fontSize="sm" color="fg.muted">
                Note: Items will be checked for duplicates before adding.
              </Text>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <HStack gap={2}>
              <Button onClick={handleClose} variant="outline" bg="transparent">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                colorPalette="accent"
                disabled={submitting || !title.trim()}
              >
                {submitting ? 'Adding...' : 'Add Media Item'}
              </Button>
            </HStack>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
