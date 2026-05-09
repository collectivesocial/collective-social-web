/**
 * Re-export shim for tests. Maps the test-contract props to the real component props.
 * Tests import RsvpButton from this flat path with communityDid/initialStatus props.
 */
import { useState } from 'react';
import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import type { RsvpStatus } from '../types/events';

interface RsvpButtonProps {
  eventRkey: string;
  communityDid: string;
  initialStatus?: string | null;
  apiUrl: string;
  disabled?: boolean;
  isPast?: boolean;
  onStatusChange?: (status: RsvpStatus | null) => void;
}

const RSVP_OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: 'going', label: 'Going' },
  { value: 'interested', label: 'Maybe' },
  { value: 'notgoing', label: 'Not Going' },
];

export function RsvpButton({
  eventRkey,
  communityDid,
  initialStatus,
  apiUrl,
  disabled,
  isPast,
  onStatusChange,
}: RsvpButtonProps) {
  const [status, setStatus] = useState<RsvpStatus | null>(
    (initialStatus as RsvpStatus | null) ?? null
  );
  const [loading, setLoading] = useState(false);

  if (isPast) {
    return (
      <Text fontSize="sm" color="fg.muted" fontStyle="italic">
        This event has passed.
      </Text>
    );
  }

  const handleSelect = async (value: RsvpStatus) => {
    const isSame = status === value;
    const previous = status;
    const next = isSame ? null : value;
    setStatus(next);
    onStatusChange?.(next);
    setLoading(true);

    try {
      if (isSame) {
        const res = await fetch(
          `${apiUrl}/groups/${encodeURIComponent(communityDid)}/events/${encodeURIComponent(eventRkey)}/rsvp`,
          { method: 'DELETE', credentials: 'include' }
        );
        if (!res.ok) throw new Error('Failed to remove RSVP');
      } else {
        const res = await fetch(
          `${apiUrl}/groups/${encodeURIComponent(communityDid)}/events/${encodeURIComponent(eventRkey)}/rsvp`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: value }),
          }
        );
        if (!res.ok) throw new Error('Failed to set RSVP');
      }
    } catch {
      setStatus(previous);
      onStatusChange?.(previous);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack align="stretch" gap={2}>
      <HStack
        role="radiogroup"
        aria-label="RSVP to this event"
        gap={0}
        borderWidth="1px"
        borderColor="border.card"
        borderRadius="md"
        overflow="hidden"
        display="inline-flex"
        alignSelf="flex-start"
      >
        {RSVP_OPTIONS.map((option, i) => {
          const isActive = status === option.value;
          return (
            <Button
              key={option.value}
              role="radio"
              aria-checked={isActive}
              size="sm"
              variant="ghost"
              borderRadius="none"
              borderRightWidth={i < RSVP_OPTIONS.length - 1 ? '1px' : '0'}
              borderRightColor="border.card"
              bg={isActive ? 'teal.subtle' : 'transparent'}
              color={isActive ? 'teal.fg' : 'fg.default'}
              fontWeight={isActive ? 'semibold' : 'normal'}
              _hover={{ bg: isActive ? 'teal.subtle' : 'bg.subtle' }}
              onClick={() => handleSelect(option.value)}
              disabled={disabled || loading}
              px={4}
            >
              {option.label}
            </Button>
          );
        })}
      </HStack>

      <Text fontSize="xs" color="fg.subtle">
        Your RSVP is saved to your account and visible to group members.
      </Text>
    </VStack>
  );
}
