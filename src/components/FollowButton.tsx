import { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';

interface FollowButtonProps {
  apiUrl: string;
  userDid: string;
  initialFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ apiUrl, userDid, initialFollowing, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/follow/${userDid}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (res.ok) {
        setIsFollowing(true);
        onFollowChange?.(true);
        toaster.success({
          title: 'Followed successfully',
        });
      } else {
        toaster.error({
          title: 'Failed to follow user',
        });
      }
    } catch (err) {
      console.error('Failed to follow:', err);
      toaster.error({
        title: 'Failed to follow user',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/users/unfollow/${userDid}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setIsFollowing(false);
        onFollowChange?.(false);
        toaster.success({
          title: 'Unfollowed successfully',
        });
      } else {
        toaster.error({
          title: 'Failed to unfollow user',
        });
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
      toaster.error({
        title: 'Failed to unfollow user',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isFollowing ? (
        <Button
          onClick={handleUnfollow}
          loading={loading}
          colorPalette="accent"
          variant="outline"
          bg="transparent"
          size={{ base: 'sm', md: 'md' }}
        >
          Following
        </Button>
      ) : (
        <Button
          onClick={handleFollow}
          loading={loading}
          colorPalette="accent"
          bg="accent.500"
          size={{ base: 'sm', md: 'md' }}
        >
          Follow
        </Button>
      )}
    </>
  );
}
