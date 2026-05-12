import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Image,
  Text,
  Spinner,
  Center,
  Button,
} from '@chakra-ui/react';
import { formatRelativeTime } from '../utils/time';

interface UserItem {
  uri: string;
  title: string;
  creator: string | null;
  mediaItemId?: number | null;
  mediaType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  mediaItem?: {
    id: number;
    coverImage: string | null;
  };
}

interface InProgressItemsProps {
  apiUrl: string;
  /** How many items to show. Defaults to 3 — enough to feel like a nudge,
   *  not a full library replica. */
  limit?: number;
}

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

const mediaTypeVerb: Record<string, string> = {
  book: 'reading',
  movie: 'watching',
  tv: 'watching',
  music: 'listening to',
  game: 'playing',
  podcast: 'listening to',
  article: 'reading',
  video: 'watching',
  course: 'taking',
};

/**
 * Home-page nudge card that surfaces the items the user has marked as
 * `in-progress`, so they're prompted to update their progress / mark them
 * done. Sorted by most-recently-updated so the freshest reads show first.
 *
 * Hidden entirely when the user has no in-progress items so we don't waste
 * vertical real estate showing an empty state on the home page.
 */
export function InProgressItems({ apiUrl, limit = 3 }: InProgressItemsProps) {
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiUrl}/useritems`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : { useritems: [] }))
      .then(data => {
        if (cancelled) return;
        // The PDS can hold more than one useritem record for the same media
        // (e.g. a quick-add from a group context creating a duplicate of an
        // older record). Dedupe by mediaItemId — falling back to title for
        // user-created items without a media-items row — and keep the most
        // recently updated copy so the nudge surfaces the freshest state.
        const inProgress = ((data.useritems as UserItem[]) || []).filter(
          u => u.status === 'in-progress'
        );
        const byKey = new Map<string, UserItem>();
        for (const item of inProgress) {
          const key = item.mediaItemId
            ? `media:${item.mediaItemId}`
            : `title:${(item.title || '').trim().toLowerCase()}`;
          const existing = byKey.get(key);
          const ts = (i: UserItem) => new Date(i.updatedAt || i.createdAt).getTime();
          if (!existing || ts(item) > ts(existing)) {
            byKey.set(key, item);
          }
        }
        const deduped = Array.from(byKey.values())
          .sort((a, b) => {
            const ta = new Date(a.updatedAt || a.createdAt).getTime();
            const tb = new Date(b.updatedAt || b.createdAt).getTime();
            return tb - ta;
          })
          .slice(0, limit);
        setItems(deduped);
      })
      .catch(err => {
        console.warn('Failed to fetch in-progress items:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, limit]);

  // Don't render anything once we know the user has nothing in progress —
  // an empty card would just be visual noise on the home view.
  if (!loading && items.length === 0) return null;

  return (
    <Box p={6} bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card">
      <Heading size="lg" mb={1} fontFamily="heading">
        Pick up where you left off
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={4}>
        You have {items.length} item{items.length === 1 ? '' : 's'} in progress — tap one to update
        your status.
      </Text>

      {loading ? (
        <Center py={6}>
          <Spinner size="md" color="accent.default" />
        </Center>
      ) : (
        <VStack gap={3} align="stretch">
          {items.map(item => {
            const verb = mediaTypeVerb[item.mediaType || ''] || 'tracking';
            const lastUpdated = item.updatedAt || item.createdAt;
            return (
              <HStack
                key={item.uri}
                gap={3}
                align="center"
                p={3}
                borderRadius="md"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.subtle"
                cursor={item.mediaItemId ? 'pointer' : 'default'}
                transition="all 0.2s ease"
                _hover={item.mediaItemId ? { shadow: 'sm', transform: 'translateY(-1px)' } : {}}
                onClick={() => {
                  if (item.mediaItemId) navigate(`/items/${item.mediaItemId}`);
                }}
              >
                {item.mediaItem?.coverImage ? (
                  <Image
                    src={item.mediaItem.coverImage}
                    alt={item.title}
                    w="48px"
                    h="72px"
                    objectFit="cover"
                    borderRadius="sm"
                    flexShrink={0}
                  />
                ) : (
                  <Box
                    w="48px"
                    h="72px"
                    bg="bg.emphasized"
                    borderRadius="sm"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    flexShrink={0}
                  >
                    {mediaTypeEmoji[item.mediaType || ''] || '📄'}
                  </Box>
                )}
                <Box flex="1" minW={0}>
                  <Text fontSize="xs" color="fg.subtle" textTransform="uppercase">
                    Currently {verb}
                  </Text>
                  <Text fontWeight="semibold" lineClamp={1}>
                    {item.title}
                  </Text>
                  {item.creator && (
                    <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                      by {item.creator}
                    </Text>
                  )}
                  <Text fontSize="xs" color="fg.subtle" mt={1}>
                    Updated {formatRelativeTime(lastUpdated) || 'recently'}
                  </Text>
                </Box>
                {item.mediaItemId && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorPalette="accent"
                    flexShrink={0}
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/items/${item.mediaItemId}`);
                    }}
                  >
                    Update
                  </Button>
                )}
              </HStack>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}
