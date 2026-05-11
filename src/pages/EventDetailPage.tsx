import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  HStack,
  Link as ChakraLink,
  Spinner,
  Text,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { LuMapPin, LuVideo, LuCalendar, LuTrash2, LuEllipsisVertical } from 'react-icons/lu';
import type { GroupEvent } from '../types/events';
import type { RsvpAggregate } from '../types/events';
import { RsvpButton } from '../components/events/RsvpButton';
import { AttendeeList } from '../components/events/AttendeeList';
import { EmptyState } from '../components/EmptyState';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogBackdrop,
  DialogPositioner,
  DialogActionTrigger,
} from '../components/ui/dialog';

interface EventDetailPageProps {
  apiUrl: string;
}

function formatEventDateRange(startsAt: string, endsAt?: string): string {
  const start = new Date(startsAt);
  if (isNaN(start.getTime())) return startsAt;

  const startStr = start.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  if (!endsAt) return startStr;

  const end = new Date(endsAt);
  if (isNaN(end.getTime())) return startStr;

  const endStr = end.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${startStr} – ${endStr}`;
}

export function EventDetailPage({ apiUrl }: EventDetailPageProps) {
  const { groupDid, eventRkey } = useParams<{ groupDid: string; eventRkey: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<GroupEvent | null>(null);
  const [aggregate, setAggregate] = useState<RsvpAggregate | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!groupDid || !eventRkey) return;

    const fetchAll = async () => {
      try {
        const [eventRes, rsvpsRes, groupRes] = await Promise.all([
          fetch(
            `${apiUrl}/groups/${encodeURIComponent(groupDid)}/events/${encodeURIComponent(eventRkey)}`,
            { credentials: 'include' }
          ),
          fetch(
            `${apiUrl}/groups/${encodeURIComponent(groupDid)}/events/${encodeURIComponent(eventRkey)}/rsvps`,
            { credentials: 'include' }
          ),
          fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid)}`, {
            credentials: 'include',
          }),
        ]);

        if (!eventRes.ok) {
          if (eventRes.status === 404) throw new Error('Event not found');
          throw new Error('Failed to load event');
        }

        const eventData = await eventRes.json();
        setEvent(eventData.event ?? eventData);

        if (rsvpsRes.ok) {
          const rsvpData = await rsvpsRes.json();
          setAggregate(rsvpData);
        }

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroupName(groupData.community?.display_name || groupData.community?.handle || '');
          setIsAdmin(groupData.is_admin === true);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [apiUrl, groupDid, eventRkey]);

  const handleDelete = async () => {
    if (!groupDid || !eventRkey) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid)}/events/${encodeURIComponent(eventRkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to delete event');
      navigate(`/groups/${encodeURIComponent(groupDid)}`);
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="3xl" py={8}>
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.solid" />
            <Text color="fg.muted">Loading event...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxW="3xl" py={8}>
        <EmptyState
          icon="😕"
          title={error || 'Event not found'}
          description="This event may have been removed."
        />
        <Center mt={6}>
          <Button
            variant="outline"
            onClick={() => navigate(`/groups/${encodeURIComponent(groupDid || '')}`)}
          >
            ← Back to Group
          </Button>
        </Center>
      </Container>
    );
  }

  const isPast = event.status === 'past' || event.status === 'cancelled';

  return (
    <Container maxW="3xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() => navigate(`/groups/${encodeURIComponent(groupDid!)}`)}
          color="fg.muted"
          _hover={{ color: 'fg.default' }}
        >
          ← Back to Group
        </Button>

        {/* Hero card */}
        <Box
          bg="bg.card"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.card"
          p={6}
          position="relative"
        >
          {isAdmin && (
            <Box position="absolute" top={4} right={4}>
              <Button
                size="sm"
                variant="ghost"
                color="fg.muted"
                onClick={() => setShowMenu(v => !v)}
                aria-label="Event options"
              >
                <LuEllipsisVertical />
              </Button>

              {showMenu && (
                <Box
                  position="absolute"
                  right={0}
                  top="100%"
                  mt={1}
                  bg="bg"
                  borderWidth="1px"
                  borderColor="border.card"
                  borderRadius="md"
                  shadow="md"
                  zIndex={10}
                  minW="160px"
                  onClick={() => setShowMenu(false)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="flex-start"
                    color="fg.muted"
                    fontWeight="normal"
                    disabled
                    px={4}
                    py={2}
                    borderRadius="none"
                  >
                    {/* TODO: Edit event */}
                    Edit event
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    w="full"
                    justifyContent="flex-start"
                    color="red.fg"
                    fontWeight="normal"
                    px={4}
                    py={2}
                    borderRadius="none"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <LuTrash2 />
                    Delete event
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <VStack align="stretch" gap={4}>
            <HStack gap={2} flexWrap="wrap">
              {event.status === 'ongoing' && <Badge colorPalette="red">Live Now</Badge>}
              {event.status === 'cancelled' && <Badge colorPalette="gray">Cancelled</Badge>}
              {event.mode === 'virtual' && (
                <Badge colorPalette="blue" variant="subtle">
                  Virtual
                </Badge>
              )}
              {event.mode === 'hybrid' && (
                <Badge colorPalette="purple" variant="subtle">
                  Hybrid
                </Badge>
              )}
            </HStack>

            <Heading size="xl" fontFamily="heading" pr={isAdmin ? 10 : 0}>
              {event.name}
            </Heading>

            <VStack align="stretch" gap={2}>
              <HStack gap={2} color="fg.muted" fontSize="sm">
                <LuCalendar />
                <Text>{formatEventDateRange(event.startsAt, event.endsAt)}</Text>
              </HStack>

              {(() => {
                // Pick the structured fields first; fall back to the legacy
                // free-form `location` string (which may be a URL or an
                // address depending on how the event was created).
                const place = event.locations?.[0];
                const placeLabel = place
                  ? [place.name, place.locality, place.region].filter(Boolean).join(', ')
                  : event.location && !/^https?:\/\//i.test(event.location)
                    ? event.location
                    : null;
                const primaryUri = event.uris?.[0];
                const linkHref = primaryUri?.uri
                  ? primaryUri.uri
                  : event.location && /^https?:\/\//i.test(event.location)
                    ? event.location
                    : null;
                const linkLabel = primaryUri?.name || linkHref || '';

                return (
                  <>
                    {placeLabel && (
                      <HStack gap={2} color="fg.muted" fontSize="sm">
                        <LuMapPin />
                        <Text>{placeLabel}</Text>
                      </HStack>
                    )}
                    {linkHref && (
                      <HStack gap={2} color="fg.muted" fontSize="sm">
                        <LuVideo />
                        <ChakraLink
                          href={linkHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          color="accent.fg"
                          wordBreak="break-all"
                        >
                          {linkLabel}
                        </ChakraLink>
                      </HStack>
                    )}
                  </>
                );
              })()}

              {groupName && (
                <Text fontSize="sm" color="fg.subtle">
                  Organized by{' '}
                  <Text as="span" fontWeight="medium" color="fg.muted">
                    {groupName}
                  </Text>
                </Text>
              )}
            </VStack>

            <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
              <HStack gap={3} fontSize="sm" color="fg.muted">
                {event.rsvpCounts.going > 0 && <Text>{event.rsvpCounts.going} going</Text>}
                {event.rsvpCounts.interested > 0 && (
                  <Text>{event.rsvpCounts.interested} interested</Text>
                )}
              </HStack>
            </Flex>

            {!isPast && (
              <RsvpButton
                eventRkey={event.rkey}
                groupDid={groupDid!}
                currentStatus={event.myRsvp}
                isPast={isPast}
                apiUrl={apiUrl}
                onStatusChange={newStatus => {
                  setEvent(prev =>
                    prev
                      ? {
                          ...prev,
                          myRsvp: newStatus,
                          rsvpCounts: recalcCounts(prev.rsvpCounts, prev.myRsvp ?? null, newStatus),
                        }
                      : prev
                  );
                }}
              />
            )}

            {isPast && (
              <Text fontSize="sm" color="fg.muted" fontStyle="italic">
                This event has passed.
              </Text>
            )}
          </VStack>
        </Box>

        {/* Description */}
        {event.description && (
          <Box bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card" p={6}>
            <Heading size="sm" mb={3} color="fg.muted">
              About this event
            </Heading>
            <Text whiteSpace="pre-wrap">{event.description}</Text>
          </Box>
        )}

        {/* Attendees */}
        {aggregate && (
          <Box bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card" p={6}>
            <Heading size="sm" mb={4} color="fg.muted">
              Attendees
            </Heading>
            <AttendeeList aggregate={aggregate} />
          </Box>
        )}
      </VStack>

      {/* Delete confirm dialog */}
      <DialogRoot
        open={showDeleteConfirm}
        onOpenChange={details => setShowDeleteConfirm(details.open)}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this event?</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>
                Members who RSVPed won't be notified automatically. This action cannot be undone.
              </Text>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline" bg="transparent">
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button colorPalette="red" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Container>
  );
}

/** Recalculate RSVP counts after optimistic update */
function recalcCounts(
  counts: { going: number; interested: number; notgoing: number },
  prev: 'going' | 'interested' | 'notgoing' | null,
  next: 'going' | 'interested' | 'notgoing' | null
): { going: number; interested: number; notgoing: number } {
  const updated = { ...counts };
  if (prev) updated[prev] = Math.max(0, updated[prev] - 1);
  if (next) updated[next] = updated[next] + 1;
  return updated;
}
