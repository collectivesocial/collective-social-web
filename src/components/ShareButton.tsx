import { useState } from 'react';
import { IconButton } from '@chakra-ui/react';
import { toaster } from './ui/toaster';
import { LuShare2 } from 'react-icons/lu';

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
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
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
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.url);
      
      toaster.create({
        title: 'Share link copied!',
        description: 'The share link has been copied to your clipboard.',
        type: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Share error:', err);
      toaster.create({
        title: 'Failed to create share link',
        description: err.message || 'Please try again later.',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <IconButton
      aria-label="Share this item"
      onClick={handleShare}
      disabled={isSharing}
      colorPalette="teal"
      variant={variant}
      size={size}
      flexShrink={0}
      bg="transparent"
    >
      <LuShare2 />
    </IconButton>
  );
}
