import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Text,
  VStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { UserProfileView } from '../components/UserProfileView';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility: string;
  purpose: string;
  avatar: string | null;
  createdAt: string;
}

interface ProfilePageProps {
  apiUrl: string;
}

export function ProfilePage({ apiUrl }: ProfilePageProps) {
  const { handle } = useParams<{ handle: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If handle is provided in params, load that user's profile
    if (handle) {
      // Fetch current user if logged in
      const fetchCurrentUser = async () => {
        try {
          const userRes = await fetch(`${apiUrl}/users/me`, {
            credentials: 'include',
          });
          if (userRes.ok) {
            const userData = await userRes.json();
            setCurrentUser(userData);
            return userData;
          }
        } catch (err) {
          console.log('User not logged in');
        }
        return null;
      };

      // Fetch user profile from Bluesky public API
      const fetchProfile = async () => {
        try {
          const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
          if (!res.ok) {
            throw new Error('Profile not found');
          }
          return await res.json();
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
          throw err;
        }
      };

      const loadProfile = async () => {
        try {
          const [currentUserData, profileData] = await Promise.all([
            fetchCurrentUser(),
            fetchProfile(),
          ]);

          const profile: UserProfile = {
            did: profileData.did,
            handle: profileData.handle,
            displayName: profileData.displayName,
            avatar: profileData.avatar,
            description: profileData.description,
          };
          setUser(profile);

          // Fetch public collections for this user
          try {
            const collectionsRes = await fetch(`${apiUrl}/collections/public/${profileData.did}`);
            if (collectionsRes.ok) {
              const collectionsData = await collectionsRes.json();
              setCollections(collectionsData.collections);
            }
          } catch (err) {
            console.error('Failed to load collections:', err);
          }

          // Check follow status if logged in and viewing someone else's profile
          if (currentUserData && currentUserData.did !== profileData.did) {
            try {
              const followRes = await fetch(`${apiUrl}/users/following/${profileData.did}`, {
                credentials: 'include',
              });
              if (followRes.ok) {
                const followData = await followRes.json();
                setIsFollowing(followData.isFollowing);
              }
            } catch (err) {
              console.error('Failed to check follow status:', err);
            }
          }

          setLoading(false);
        } catch (err) {
          // Error already handled in fetchProfile
        }
      };

      loadProfile();
    } else {
      // No handle provided, load current user's profile
      fetch(`${apiUrl}/users/me`, {
        credentials: 'include',
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error('Not authenticated');
          }
          return res.json();
        })
        .then(async (data) => {
          setUser(data);
          setCurrentUser(data);
          
          // Fetch public collections for this user
          try {
            const collectionsRes = await fetch(`${apiUrl}/collections/public/${data.did}`, {
              credentials: 'include',
            });
            if (collectionsRes.ok) {
              const collectionsData = await collectionsRes.json();
              setCollections(collectionsData.collections);
            }
          } catch (err) {
            console.error('Failed to load collections:', err);
          }
          
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
          // Redirect to home if not authenticated
          navigate('/');
        });
    }
  }, [apiUrl, navigate, handle]);

  if (loading) {
    return (
      <Center minH="50vh">
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text color="fg.muted">Loading profile...</Text>
        </VStack>
      </Center>
    );
  }

  if (error || !user) {
    return (
      <Center minH="50vh">
        <Text color="red.500" fontSize="lg">
          Error: {error || 'Unable to load profile'}
        </Text>
      </Center>
    );
  }

  const isOwnProfile = currentUser?.did === user.did;
  const showFollowButton = !!currentUser && !isOwnProfile;

  return (
    <UserProfileView
      apiUrl={apiUrl}
      user={user}
      collections={collections}
      isOwnProfile={isOwnProfile}
      showFollowButton={showFollowButton}
      isFollowing={isFollowing}
      onFollowChange={(following) => setIsFollowing(following)}
    />
  );
}
