import { useState } from 'react';
import { IconButton, Button, Dialog, Portal, VStack, Text, Input, HStack, Box, QrCode } from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { LuShare2, LuCopy } from 'react-icons/lu';
import { SiBluesky } from 'react-icons/si';

interface ShareButtonProps {
  apiUrl: string;
  mediaItemId: number;
  mediaType: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
}

export function ShareButton({ 
  apiUrl, 
  mediaItemId, 
  mediaType, 
  size = 'md',
  variant = 'outline' 
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [itemTitle, setItemTitle] = useState<string | null>(null);

  const handleOpenDialog = async () => {
    setIsOpen(true);
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mediaItemId,
          mediaType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.url);
      setItemTitle(data.title || null);
    } catch (err: any) {
      console.error('Share error:', err);
      toaster.create({
        title: 'Failed to create share link',
        description: err.message || 'Please try again later.',
        type: 'error',
        duration: 3000,
      });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toaster.create({
        title: 'Link copied!',
        description: 'The share link has been copied to your clipboard.',
        type: 'success',
        duration: 2000,
      });
    } catch (err) {
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
      <IconButton
        aria-label="Share this item"
        onClick={handleOpenDialog}
        variant={variant}
        size={size}
        flexShrink={0}
        bg="transparent"
        color={{ base: 'white', _light: 'black' }}
        _hover={{ bg: { base: 'whiteAlpha.200', _light: 'blackAlpha.100' } }}
      >
        <LuShare2 />
      </IconButton>

      <Dialog.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Share this item</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {isLoading ? (
                  <Text color="fg.muted">Generating share link...</Text>
                ) : shareUrl ? (
                  <VStack gap={4} align="stretch">
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>
                        Share Link
                      </Text>
                      <HStack>
                        <Input 
                          value={shareUrl} 
                          readOnly 
                          size="sm"
                          fontFamily="mono"
                          fontSize="xs"
                        />
                        <Button
                          onClick={handleCopyLink}
                          size="sm"
                          colorPalette="teal"
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
                      <Button
                        asChild
                        size="sm"
                        colorPalette="blue"
                        width="full"
                        color="white"
                      >
                        <a
                          href={`https://bsky.app/intent/compose?text=${encodeURIComponent(
                            `Check out ${itemTitle || 'this item'} on @collectivesocial.app at: ${shareUrl}`
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
                ) : null}
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" bg="transparent">Close</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
