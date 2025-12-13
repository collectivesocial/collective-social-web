import { useState } from 'react';
import { IconButton, Button } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
  DialogTitle,
} from './ui/dialog';
import { toaster } from './ui/toaster';
import { LuShare2, LuCopy, LuX } from 'react-icons/lu';
import { VStack, Text, Input, HStack, Box } from '@chakra-ui/react';
import { QrCode } from './ui/qr-code';

interface ShareReviewButtonProps {
  apiUrl: string;
  reviewId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
}

export function ShareReviewButton({ 
  apiUrl, 
  reviewId,
  size = 'sm',
  variant = 'ghost' 
}: ShareReviewButtonProps) {
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
          reviewId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.url);
      setItemTitle(data.title || null);
    } catch (err: any) {
      console.error('Failed to create share link:', err);
      toaster.create({
        title: 'Failed to create share link',
        description: err.message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      toaster.create({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
        type: 'success',
      });
    }
  };

  const handleShareToBluesky = () => {
    if (shareUrl) {
      const text = itemTitle 
        ? `Check out my review: ${itemTitle}` 
        : 'Check out my review on Collective!';
      const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text + '\n\n' + shareUrl)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <IconButton
        aria-label="Share review"
        onClick={handleOpenDialog}
        size={size}
        variant={variant}
        colorPalette="teal"
        bg="transparent"
      >
        <LuShare2 />
      </IconButton>

      <DialogRoot 
        open={isOpen} 
        onOpenChange={(e) => setIsOpen(e.open)}
        size={{ base: 'xs', md: 'md' }}
        placement="center"
        motionPreset="slide-in-bottom"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Review</DialogTitle>
            <DialogCloseTrigger bg="transparent">
              <LuX />
            </DialogCloseTrigger>
          </DialogHeader>
          <DialogBody pb={4}>
            {isLoading ? (
              <Text color="fg.muted">Creating share link...</Text>
            ) : shareUrl ? (
              <VStack gap={4} align="stretch" pb={2}>
                <Box>
                  <Text fontSize="sm" color="fg.muted" mb={2}>
                    Share your review with others:
                  </Text>
                  <HStack gap={2}>
                    <Input value={shareUrl} readOnly />
                    <IconButton
                      aria-label="Copy link"
                      onClick={handleCopyLink}
                      colorPalette="teal"
                      variant="outline"
                      bg="transparent"
                    >
                      <LuCopy />
                    </IconButton>
                  </HStack>
                </Box>

                <Button 
                  onClick={handleShareToBluesky}
                  colorPalette="blue"
                  width="full"
                  color="white"
                >
                  Share on Bluesky
                </Button>

                <Box>
                  <Text fontSize="sm" color="fg.muted" mb={2} textAlign="center">
                    Scan QR Code
                  </Text>
                  <Box display="flex" justifyContent="center">
                    <QrCode value={shareUrl} size="xl" />
                  </Box>
                </Box>
              </VStack>
            ) : (
              <Text color="red.500">Failed to create share link</Text>
            )}
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </>
  );
}
