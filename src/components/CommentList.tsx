import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Button,
} from '@chakra-ui/react';
import { LuMessageSquare, LuPencil, LuTrash2, LuReply } from 'react-icons/lu';
import { Avatar } from './ui/avatar';
import { CommentForm } from './CommentForm';
import { renderTextWithLinks } from '../utils/textUtils';

interface User {
  did: string;
  handle: string;
  displayName: string;
  avatar: string | null;
}

interface Comment {
  id: number;
  uri: string;
  cid: string;
  userDid: string;
  text: string;
  reviewUri: string | null;
  parentCommentUri: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

interface CommentListProps {
  reviewUri: string;
  apiUrl: string;
  currentUserDid: string | null;
  autoFocusForm?: boolean;
  onCommentFormClose?: () => void;
}

interface CommentItemProps {
  comment: Comment;
  apiUrl: string;
  currentUserDid: string | null;
  onReply: (parentUri: string) => void;
  onDelete: (commentUri: string) => void;
  onUpdate: (commentUri: string, text: string) => void;
  depth?: number;
}

function CommentItem({
  comment,
  apiUrl,
  currentUserDid,
  onReply,
  onDelete,
  onUpdate,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyCount, setReplyCount] = useState(0);

  const isOwnComment = currentUserDid === comment.userDid;
  const maxDepth = 3; // Limit nesting to 3 levels

  // Fetch replies when expanded
  useEffect(() => {
    if (showReplies && replies.length === 0) {
      fetchReplies();
    }
  }, [showReplies]);

  const fetchReplies = async () => {
    setLoadingReplies(true);
    try {
      const encodedUri = encodeURIComponent(comment.uri);
      const response = await fetch(`${apiUrl}/comments/${encodedUri}/replies`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setReplies(data.replies || []);
        setReplyCount(data.replies?.length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = async (text: string) => {
    try {
      const response = await fetch(`${apiUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text,
          parentCommentUri: comment.uri,
        }),
      });

      if (response.ok) {
        setShowReplyForm(false);
        // Refresh replies
        await fetchReplies();
        setShowReplies(true);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
      throw err;
    }
  };

  const handleEdit = async () => {
    try {
      const encodedUri = encodeURIComponent(comment.uri);
      const response = await fetch(`${apiUrl}/comments/${encodedUri}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: editText }),
      });

      if (response.ok) {
        onUpdate(comment.uri, editText);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const encodedUri = encodeURIComponent(comment.uri);
      const response = await fetch(`${apiUrl}/comments/${encodedUri}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        onDelete(comment.uri);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box>
      <HStack align="start" gap={3}>
        <Avatar
          src={comment.user?.avatar || undefined}
          name={comment.user?.displayName || comment.user?.handle}
          size="sm"
        />
        <VStack align="stretch" flex={1} gap={1}>
          <HStack gap={2}>
            <Text fontWeight="semibold" fontSize="sm">
              {comment.user?.displayName || comment.user?.handle}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              @{comment.user?.handle}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              •
            </Text>
            <Text fontSize="xs" color="fg.muted">
              {formatDate(comment.createdAt)}
            </Text>
            {comment.createdAt !== comment.updatedAt && (
              <Text fontSize="xs" color="fg.muted">
                (edited)
              </Text>
            )}
          </HStack>

          {isEditing ? (
            <Box mt={2}>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--chakra-colors-border)',
                }}
              />
              <HStack mt={2} gap={2}>
                <Button size="sm" colorPalette="teal" onClick={handleEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(comment.text);
                  }}
                >
                  Cancel
                </Button>
              </HStack>
            </Box>
          ) : (
            <>
              <Text fontSize="sm">{renderTextWithLinks(comment.text)}</Text>

              <HStack gap={3} mt={1}>
                {currentUserDid && depth < maxDepth && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                  >
                    <LuReply />
                    Reply
                  </Button>
                )}

                {isOwnComment && (
                  <>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                    >
                      <LuPencil />
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorPalette="red"
                      onClick={handleDelete}
                    >
                      <LuTrash2 />
                      Delete
                    </Button>
                  </>
                )}

                {replyCount > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowReplies(!showReplies)}
                  >
                    {showReplies ? 'Hide' : 'Show'} {replyCount}{' '}
                    {replyCount === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </HStack>
            </>
          )}

          {showReplyForm && (
            <Box mt={3} pl={4} borderLeft="2px solid" borderColor="border">
              <CommentForm
                parentCommentUri={comment.uri}
                placeholder="Write a reply..."
                onSubmit={handleReply}
                onCancel={() => setShowReplyForm(false)}
                apiUrl={apiUrl}
              />
            </Box>
          )}

          {showReplies && (
            <Box mt={3} pl={4} borderLeft="2px solid" borderColor="border">
              {loadingReplies ? (
                <Center py={4}>
                  <Spinner size="sm" />
                </Center>
              ) : (
                <VStack align="stretch" gap={4}>
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.uri}
                      comment={reply}
                      apiUrl={apiUrl}
                      currentUserDid={currentUserDid}
                      onReply={onReply}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      depth={depth + 1}
                    />
                  ))}
                </VStack>
              )}
            </Box>
          )}
        </VStack>
      </HStack>
    </Box>
  );
}

export function CommentList({
  reviewUri,
  apiUrl,
  currentUserDid,
  autoFocusForm = false,
  onCommentFormClose,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(autoFocusForm);

  useEffect(() => {
    fetchComments();
  }, [reviewUri]);

  useEffect(() => {
    if (autoFocusForm) {
      setShowCommentForm(true);
    }
  }, [autoFocusForm]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    try {
      const encodedUri = encodeURIComponent(reviewUri);
      const response = await fetch(`${apiUrl}/comments/review/${encodedUri}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        setError('Failed to load comments');
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = async (text: string) => {
    try {
      const response = await fetch(`${apiUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          text,
          reviewUri,
        }),
      });

      if (response.ok) {
        await fetchComments();
        setShowCommentForm(false);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      throw err;
    }
  };

  const handleDeleteComment = (commentUri: string) => {
    setComments((prev) => prev.filter((c) => c.uri !== commentUri));
  };

  const handleUpdateComment = (commentUri: string, text: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.uri === commentUri
          ? { ...c, text, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="lg" color="teal.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box py={4}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Text fontSize="lg" fontWeight="semibold">
          Comments ({comments.length})
        </Text>
        {currentUserDid && !showCommentForm && (
          <Button
            size="sm"
            colorPalette="teal"
            onClick={() => setShowCommentForm(true)}
          >
            <LuMessageSquare />
            Add Comment
          </Button>
        )}
      </HStack>

      {showCommentForm && (
        <Box mb={6} p={4} bg="bg.subtle" borderRadius="md">
          <CommentForm
            reviewUri={reviewUri}
            onSubmit={handleNewComment}
            onCancel={() => {
              setShowCommentForm(false);
              if (onCommentFormClose) {
                onCommentFormClose();
              }
            }}
            apiUrl={apiUrl}
          />
        </Box>
      )}

      {comments.length === 0 ? (
        <Box py={8} textAlign="center">
          <Text color="fg.muted">
            No comments yet. Be the first to comment!
          </Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={6}>
          {comments.map((comment) => (
            <CommentItem
              key={comment.uri}
              comment={comment}
              apiUrl={apiUrl}
              currentUserDid={currentUserDid}
              onReply={() => {}}
              onDelete={handleDeleteComment}
              onUpdate={handleUpdateComment}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}
