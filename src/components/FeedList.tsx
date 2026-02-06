import { useEffect, useState } from 'react';
import { Stack, Text, Spinner, Center } from '@chakra-ui/react';
import { FeedEventCard } from './FeedEventCard';

interface FeedEvent {
  id: number;
  eventName: string;
  mediaLink: string | null;
  userDid: string;
  createdAt: string;
}

interface UserProfile {
  handle: string;
  avatar?: string;
  displayName?: string;
}

interface FeedListProps {
  apiUrl: string;
  limit?: number;
}

export function FeedList({ apiUrl, limit = 20 }: FeedListProps) {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/feed/events?limit=${limit}`)
      .then((res) => res.json())
      .then(async (data) => {
        setFeedEvents(data.events);

        // Fetch user profiles for all DIDs in the feed
        const uniqueDids = Array.from(
          new Set(data.events.map((e: FeedEvent) => e.userDid))
        ) as string[];
        const profiles: Record<string, UserProfile> = {};

        await Promise.all(
          uniqueDids.map(async (did) => {
            try {
              const profileRes = await fetch(
                `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
              );
              if (profileRes.ok) {
                const profileData = await profileRes.json();
                profiles[did] = {
                  handle: profileData.handle,
                  avatar: profileData.avatar,
                  displayName: profileData.displayName,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch profile for ${did}:`, err);
            }
          })
        );

        setUserProfiles(profiles);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load feed events:', err);
        setLoading(false);
      });
  }, [apiUrl, limit]);

  if (loading) {
    return (
      <Center py={8}>
        <Spinner size="lg" color="accent.default" />
      </Center>
    );
  }

  if (feedEvents.length === 0) {
    return (
      <Center py={8}>
        <Text color="fg.muted">No recent activity</Text>
      </Center>
    );
  }

  return (
    <Stack gap={3}>
      {feedEvents.map((event) => (
        <FeedEventCard
          key={event.id}
          event={event}
          userProfile={userProfiles[event.userDid]}
        />
      ))}
    </Stack>
  );
}
