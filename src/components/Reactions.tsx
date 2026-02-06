import { useState, useEffect } from 'react';
import { HStack, Button, Text } from '@chakra-ui/react';

const EMOJI_MAP: Record<string, string> = {
  joy: '😂',
  heart: '❤️',
  grin: '😁',
  sob: '😭',
  scream: '😱',
  upside_down: '🙃',
  smirk: '😏',
};

const EMOJI_ORDER = ['heart', 'joy', 'grin', 'sob', 'scream', 'upside_down', 'smirk'];

interface ReactionsProps {
  subjectUri: string;
  subjectType: 'review' | 'comment';
  apiUrl: string;
  currentUserDid: string | null;
}

interface ReactionData {
  count: number;
  userDids: string[];
}

export function Reactions({
  subjectUri,
  subjectType,
  apiUrl,
  currentUserDid,
}: ReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, ReactionData>>({});
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReactions();
    if (currentUserDid) {
      fetchUserReactions();
    }
  }, [subjectUri]);

  const fetchReactions = async () => {
    try {
      const encodedUri = encodeURIComponent(subjectUri);
      const response = await fetch(
        `${apiUrl}/reactions/${subjectType}/${encodedUri}`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || {});
      }
    } catch (err) {
      console.error('Failed to fetch reactions:', err);
    }
  };

  const fetchUserReactions = async () => {
    try {
      const encodedUri = encodeURIComponent(subjectUri);
      const response = await fetch(
        `${apiUrl}/reactions/user/${subjectType}/${encodedUri}`,
        {
          credentials: 'include',
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserReactions(data.userReactions || []);
      }
    } catch (err) {
      console.error('Failed to fetch user reactions:', err);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUserDid || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emoji,
          subjectUri,
          subjectType,
        }),
      });

      if (response.ok) {
        // Refresh reactions
        await fetchReactions();
        await fetchUserReactions();
      }
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Determine which emojis to show
  const hasUserReacted = userReactions.length > 0;
  const emojisWithReactions = EMOJI_ORDER.filter(
    (emoji) => reactions[emoji] && reactions[emoji].count > 0
  );

  // If user hasn't reacted: show all emojis that have reactions (don't show 0 counts)
  // If user has reacted: only show emojis with reactions
  const emojisToShow = hasUserReacted
    ? emojisWithReactions
    : emojisWithReactions.length > 0
    ? emojisWithReactions
    : EMOJI_ORDER;

  return (
    <HStack gap={2} wrap="wrap">
      {emojisToShow.map((emoji) => {
        const count = reactions[emoji]?.count || 0;
        const hasReacted = userReactions.includes(emoji);

        // Don't show emojis with 0 count unless user hasn't reacted yet
        if (count === 0 && hasUserReacted) return null;

        return (
          <Button
            key={emoji}
            size="xs"
            bg="transparent"
            variant={hasReacted ? 'ghost' : 'outline'}
            colorPalette={hasReacted ? 'accent' : 'gray'}
            onClick={() => handleReaction(emoji)}
            disabled={!currentUserDid || loading}
            title={
              currentUserDid
                ? hasReacted
                  ? 'Remove reaction'
                  : 'Add reaction'
                : 'Sign in to react'
            }
            px={2}
            minH="32px"
          >
            <Text fontSize="lg">{EMOJI_MAP[emoji]}</Text>
            {count > 0 && (
              <Text fontSize="sm" ml={1}>
                {count}
              </Text>
            )}
          </Button>
        );
      })}
    </HStack>
  );
}
