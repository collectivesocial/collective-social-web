import { useState } from 'react';
import { Box, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { Avatar } from '../ui/avatar';
import type { RsvpAggregate, RsvpEntry } from '../../types/events';

interface AttendeeListProps {
  aggregate: RsvpAggregate;
}

const COLLAPSE_THRESHOLD = 20;

function AttendeeSection({
  title,
  entries,
  colorPalette,
}: {
  title: string;
  entries: RsvpEntry[];
  colorPalette: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (entries.length === 0) return null;

  const visible = expanded ? entries : entries.slice(0, COLLAPSE_THRESHOLD);
  const hasMore = entries.length > COLLAPSE_THRESHOLD;

  return (
    <Box>
      <Heading size="sm" mb={3} color={`${colorPalette}.fg`}>
        {title} ({entries.length})
      </Heading>
      <VStack align="stretch" gap={2}>
        {visible.map((person) => (
          <HStack key={person.did} gap={3}>
            <Avatar
              name={person.displayName || person.handle}
              src={person.avatar}
              size="xs"
            />
            <Box>
              {person.displayName && (
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                  {person.displayName}
                </Text>
              )}
              <Text fontSize="xs" color="fg.muted">
                @{person.handle}
              </Text>
            </Box>
          </HStack>
        ))}
      </VStack>

      {hasMore && !expanded && (
        <Button
          variant="ghost"
          size="xs"
          mt={2}
          color="fg.muted"
          onClick={() => setExpanded(true)}
        >
          Show all ({entries.length})
        </Button>
      )}
    </Box>
  );
}

export function AttendeeList({ aggregate }: AttendeeListProps) {
  const total = aggregate.going.length + aggregate.interested.length + aggregate.notgoing.length;

  if (total === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        No RSVPs yet.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={5}>
      <AttendeeSection title="Going" entries={aggregate.going} colorPalette="teal" />
      <AttendeeSection title="Maybe" entries={aggregate.interested} colorPalette="blue" />
      <AttendeeSection title="Can't make it" entries={aggregate.notgoing} colorPalette="gray" />
    </VStack>
  );
}
