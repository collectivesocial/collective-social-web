import { useState } from 'react';
import { Button, Dialog, Portal, VStack, Text, Input, HStack, Box, QrCode } from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { LuShare2, LuCopy } from 'react-icons/lu';
import { SiBluesky } from 'react-icons/si';

interface ShareGroupButtonProps {
  /** DID of the community to share. */
  groupDid: string;
  /** Display name used in the Bluesky compose intent. */
  groupName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost' | 'subtle';
}

/**
 * Share button for a group. The group page URL itself acts as the share link
 * (anyone — authenticated or not — can view the page and one-click join from
 * there), so this component just renders a dialog with copy / Bluesky / QR
 * helpers around the public URL.
 */
export function ShareGroupButton({
  groupDid,
  groupName,
  size = 'md',
  variant = 'outline',
}: ShareGroupButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = `${window.location.origin}/groups/${encodeURIComponent(groupDid)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toaster.create({
        title: 'Link copied!',
        description: 'The share link has been copied to your clipboard.',
        type: 'success',
        duration: 2000,
      });
    } catch {
      toaster.create({
        title: 'Failed to copy',
        description: 'Could not copy link to clipboard.',
        type: 'error',
        duration: 2000,
      });
    }
  };

  return (
    <>
      <Button
        aria-label="Share this group"
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        bg="transparent"
      >
        <LuShare2 /> Share
      </Button>

      <Dialog.Root open={isOpen} onOpenChange={e => setIsOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Share this group</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" color="fg.muted">
                    Anyone with this link can view the group and join with one click.
                  </Text>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Share Link
                    </Text>
                    <HStack>
                      <Input value={shareUrl} readOnly size="sm" fontFamily="mono" fontSize="xs" />
                      <Button
                        onClick={handleCopyLink}
                        size="sm"
                        colorPalette="accent"
                        variant="outline"
                        bg="transparent"
                        flexShrink={0}
                      >
                        <LuCopy /> Copy
                      </Button>
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Share to Bluesky
                    </Text>
                    <Button asChild size="sm" colorPalette="blue" width="full" color="white">
                      <a
                        href={`https://bsky.app/intent/compose?text=${encodeURIComponent(
                          `Join "${groupName}" on @collectivesocial.app: ${shareUrl}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <SiBluesky /> Share on Bluesky
                      </a>
                    </Button>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      QR Code
                    </Text>
                    <Box display="flex" justifyContent="center">
                      <QrCode.Root value={shareUrl} size="lg">
                        <QrCode.Frame>
                          <QrCode.Pattern />
                        </QrCode.Frame>
                      </QrCode.Root>
                    </Box>
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" bg="transparent">
                    Close
                  </Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
