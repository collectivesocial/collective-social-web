import { Box, Badge, Text, HStack, VStack, Flex } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import type { GroupEvent } from '../../types/events';

interface EventCardProps {
  event: GroupEvent;
  groupDid: string;
}

function formatEventDatetime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getUrgencyBadge(event: GroupEvent): { label: string; colorPalette: string } | null {
  if (event.status === 'ongoing') return { label: 'Now', colorPalette: 'red' };
  if (event.status === 'past') return { label: 'Ended', colorPalette: 'gray' };
  if (event.status === 'upcoming') {
    const msUntil = new Date(event.startsAt).getTime() - Date.now();
    const hoursUntil = msUntil / 3600000;
    if (hoursUntil > 0 && hoursUntil <= 2) {
      const minsUntil = Math.round(msUntil / 60000);
      const label = minsUntil < 60 ? `In ${minsUntil}m` : `In ${Math.round(hoursUntil)}h`;
      return { label, colorPalette: 'yellow' };
    }
  }
  return null;
}

function getRsvpBadge(event: GroupEvent): { label: string; colorPalette: string } | null {
  if (event.myRsvp === 'going') return { label: 'Going', colorPalette: 'teal' };
  if (event.myRsvp === 'interested') return { label: 'Maybe', colorPalette: 'blue' };
  return null;
}

export function EventCard({ event, groupDid }: EventCardProps) {
  const navigate = useNavigate();
  const urgencyBadge = getUrgencyBadge(event);
  const rsvpBadge = getRsvpBadge(event);
  const total = event.rsvpCounts.going + event.rsvpCounts.interested;

  return (
    <Box
      bg="bg.card"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.card"
      p={4}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ shadow: 'sm', transform: 'translateY(-1px)' }}
      onClick={() =>
        navigate(
          `/groups/${encodeURIComponent(groupDid)}/events/${encodeURIComponent(event.rkey)}`
        )
      }
    >
      <Flex justify="space-between" align="start" gap={3}>
        <VStack align="stretch" gap={1} flex="1" minW={0}>
          <HStack gap={2} flexWrap="wrap">
            {urgencyBadge && (
              <Badge colorPalette={urgencyBadge.colorPalette} size="sm">
                {urgencyBadge.label}
              </Badge>
            )}
            {rsvpBadge && (
              <Badge colorPalette={rsvpBadge.colorPalette} size="sm">
                {rsvpBadge.label}
              </Badge>
            )}
          </HStack>

          <Text fontWeight="semibold" lineClamp={1}>
            {event.name}
          </Text>

          <Text fontSize="sm" color="fg.muted">
            {formatEventDatetime(event.startsAt)}
          </Text>

          {event.location && (
            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
              📍 {event.location}
            </Text>
          )}

          {event.mode === 'virtual' && !event.location && (
            <Text fontSize="xs" color="fg.subtle">
              🖥️ Virtual
            </Text>
          )}
        </VStack>

        {total > 0 && (
          <Text fontSize="xs" color="fg.muted" flexShrink={0} mt={1}>
            {total} {total === 1 ? 'person' : 'people'}
          </Text>
        )}
      </Flex>
    </Box>
  );
}
