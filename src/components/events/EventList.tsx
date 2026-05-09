import { useState } from 'react';
import { Box, Button, Flex, Heading, Text, VStack } from '@chakra-ui/react';
import type { GroupEvent } from '../../types/events';
import { EventCard } from './EventCard';
import { EmptyState } from '../EmptyState';

interface EventListProps {
  events: GroupEvent[];
  groupDid: string;
  canCreate?: boolean;
  onCreateClick?: () => void;
}

export function EventList({ events, groupDid, canCreate, onCreateClick }: EventListProps) {
  const [showPast, setShowPast] = useState(false);

  const activeEvents = events.filter((e) => e.status !== 'past' && e.status !== 'cancelled');
  const pastEvents = events.filter((e) => e.status === 'past' || e.status === 'cancelled');

  // Sort: ongoing first, then upcoming by date
  const sorted = [...activeEvents].sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
    if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
    return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  });

  const sortedPast = [...pastEvents].sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );

  return (
    <VStack gap={4} align="stretch">
      <Flex justify="space-between" align="center">
        <Heading size="sm" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Events
        </Heading>
        {canCreate && (
          <Button
            size="sm"
            colorPalette="accent"
            variant="outline"
            onClick={onCreateClick}
          >
            + Schedule Event
          </Button>
        )}
      </Flex>

      {events.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No events yet"
          description={
            canCreate
              ? "Nothing scheduled yet. Be the first to add an event!"
              : "This group hasn't scheduled any events yet."
          }
        />
      ) : (
        <>
          {sorted.length === 0 && (
            <EmptyState
              icon="📅"
              title="No upcoming events"
              description="Check back soon!"
            />
          )}

          <VStack gap={3} align="stretch">
            {sorted.map((event) => (
              <EventCard key={event.uri} event={event} groupDid={groupDid} />
            ))}
          </VStack>

          {sortedPast.length > 0 && (
            <Box>
              <Button
                variant="ghost"
                size="sm"
                color="fg.muted"
                onClick={() => setShowPast((v) => !v)}
              >
                {showPast
                  ? 'Hide past events'
                  : `Show past events (${sortedPast.length})`}
              </Button>

              {showPast && (
                <VStack gap={3} align="stretch" mt={3}>
                  <Text fontSize="xs" color="fg.subtle" fontWeight="semibold" textTransform="uppercase">
                    Past Events
                  </Text>
                  {sortedPast.map((event) => (
                    <EventCard key={event.uri} event={event} groupDid={groupDid} />
                  ))}
                </VStack>
              )}
            </Box>
          )}
        </>
      )}
    </VStack>
  );
}
