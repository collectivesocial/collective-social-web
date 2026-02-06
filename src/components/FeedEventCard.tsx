import { Box, Flex, HStack, Text, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { Avatar } from './ui/avatar';
import { formatDate } from '../utils/time';

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

interface FeedEventCardProps {
  event: FeedEvent;
  userProfile?: UserProfile;
}

export function FeedEventCard({ event, userProfile }: FeedEventCardProps) {
  const userHandle = userProfile?.handle || event.userDid;

  const renderEventName = () => {
    const { eventName, mediaLink } = event;

    // Pattern: "{handle} {action} "{title}"
    const match = eventName.match(
      /^(.+?)\s+(wants to read|started reading|finished reading|reviewed|joined Collective!)\s*"?(.+?)"?$/
    );

    if (!match) {
      return <Text as="span">{eventName}</Text>;
    }

    const [, handle, action, title] = match;

    return (
      <Text as="span">
        <Link
          asChild
          color="accent.default"
          fontWeight="semibold"
          _hover={{ color: 'accent.hover', textDecoration: 'underline' }}
        >
          <RouterLink to={`/profile/${handle}`}>{handle}</RouterLink>
        </Link>{' '}
        {action}{' '}
        {title && title !== 'Collective!' && mediaLink ? (
          <>
            “
            <Link
              asChild
              color="accent.default"
              fontWeight="500"
              _hover={{ color: 'accent.hover', textDecoration: 'underline' }}
            >
              <RouterLink to={mediaLink}>{title}</RouterLink>
            </Link>
            ”
          </>
        ) : title ? (
          `"${title}"`
        ) : null}
      </Text>
    );
  };

  return (
    <Box
      p={4}
      bg="bg.card"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="border.card"
      borderLeftWidth="3px"
      borderLeftColor="accent.default"
      transition="all 0.2s ease"
      _hover={{
        shadow: 'sm',
        borderColor: 'border.focus',
      }}
    >
      <Flex gap={3} align="flex-start">
        <Link asChild flexShrink={0}>
          <RouterLink to={`/profile/${userHandle}`}>
            <Avatar
              size="sm"
              name={userProfile?.displayName || userHandle}
              src={userProfile?.avatar}
              outline="2px solid"
              outlineColor="accent.default"
              bg="transparent"
            />
          </RouterLink>
        </Link>

        <Flex flex={1} direction="column" gap={1} minW={0}>
          <HStack justify="space-between" align="flex-start" gap={3}>
            <Text flex={1} fontWeight="medium">
              {renderEventName()}
            </Text>
            <Text color="fg.muted" fontSize="sm" whiteSpace="nowrap">
              {formatDate(event.createdAt)}
            </Text>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}
