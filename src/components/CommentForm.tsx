import { useState } from 'react';
import { Box, Button, Textarea, Text } from '@chakra-ui/react';
import { LuMessageSquare } from 'react-icons/lu';

interface CommentFormProps {
  reviewUri?: string;
  parentCommentUri?: string;
  placeholder?: string;
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  apiUrl: string;
}

export function CommentForm({
  placeholder = 'Write a comment...',
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (text.length > 3000) {
      setError('Comment cannot exceed 3000 characters');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(text.trim());
      setText('');
      if (onCancel) onCancel();
    } catch (err) {
      console.error('Failed to submit comment:', err);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={3000}
        disabled={submitting}
      />
      {error && (
        <Text color="red.500" fontSize="sm" mt={2}>
          {error}
        </Text>
      )}
      <Text fontSize="xs" color="fg.muted" mt={1}>
        {text.length}/3000
      </Text>
      <Box mt={3} display="flex" gap={2}>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          colorPalette="teal"
          size="sm"
        >
          <LuMessageSquare />
          {submitting ? 'Posting...' : 'Post Comment'}
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="ghost" size="sm">
            Cancel
          </Button>
        )}
      </Box>
    </Box>
  );
}
