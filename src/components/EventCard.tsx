/**
 * Re-export shim for tests. Maps the test-contract props to the real component props.
 * Tests import EventCard from this flat path with `event` prop using `title`/`status` fields.
 */
import { Box, Badge, Text, HStack, VStack, Flex } from '@chakra-ui/react';

interface EventRecord {
  rkey: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  rsvpCounts: { going: number; maybe?: number; notGoing?: number }
  status?: string;
}

interface EventCardProps {
  event: EventRecord;
  groupDid?: string;
  onClick?: () => void;
}

function formatDatetime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function EventCard({ event, onClick }: EventCardProps) {
  const isHappeningNow = event.status === 'happening-now' || event.status === 'ongoing';
  const goingCount = event.rsvpCounts?.going ?? 0;

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
      onClick={onClick}
    >
      <Flex justify="space-between" align="start" gap={3}>
        <VStack align="stretch" gap={1} flex="1" minW={0}>
          <HStack gap={2} flexWrap="wrap">
            {isHappeningNow && (
              <Badge colorPalette="red" size="sm">
                Happening Now
              </Badge>
            )}
          </HStack>

          <Text fontWeight="semibold" lineClamp={1}>
            {event.title}
          </Text>

          <Text fontSize="sm" color="fg.muted">
            {formatDatetime(event.startsAt)}
          </Text>

          {event.location && (
            <Text fontSize="xs" color="fg.subtle" lineClamp={1}>
              📍 {event.location}
            </Text>
          )}
        </VStack>

        {goingCount > 0 && (
          <Text fontSize="xs" color="fg.muted" flexShrink={0} mt={1}>
            {goingCount} going
          </Text>
        )}
      </Flex>
    </Box>
  );
}
