import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Center, VStack, Text, Spinner, Box, Button } from '@chakra-ui/react';
import { Avatar } from '../components/ui/avatar';

interface ShareRedirectPageProps {
  apiUrl: string;
}

interface ShareLinkData {
  mediaItemId?: number;
  mediaType?: string;
  collectionUri?: string;
  recommendedBy: string;
  timesClicked: number;
  createdAt: string;
}

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface Collection {
  uri: string;
  name: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
}

interface RatingDistribution {
  rating0: number;
  rating0_5: number;
  rating1: number;
  rating1_5: number;
  rating2: number;
  rating2_5: number;
  rating3: number;
  rating3_5: number;
  rating4: number;
  rating4_5: number;
  rating5: number;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  ratingDistribution?: RatingDistribution;
}

export function ShareRedirectPage({ apiUrl }: ShareRedirectPageProps) {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<ShareLinkData | null>(null);
  const [recommender, setRecommender] = useState<UserProfile | null>(null);

  useEffect(() => {
    const resolveShareLink = async () => {
      if (!shortCode) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        // Resolve the share link
        const response = await fetch(`${apiUrl}/share/${shortCode}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Share link not found or expired');
          }
          throw new Error('Failed to resolve share link');
        }

        const data: ShareLinkData = await response.json();
        setShareData(data);

        // Fetch recommender profile
        try {
          const profileResponse = await fetch(
            `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${data.recommendedBy}`
          );
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            setRecommender({
              did: profileData.did,
              handle: profileData.handle,
              displayName: profileData.displayName,
              avatar: profileData.avatar,
            });
          }
        } catch (err) {
          console.error('Failed to fetch recommender profile:', err);
        }

        // Fetch user's collections to find the default/first one
        const collectionsRes = await fetch(`${apiUrl}/collections`, {
          credentials: 'include',
        });

        if (!collectionsRes.ok) {
          // User not authenticated - store share link and redirect to home for login
          sessionStorage.setItem('pendingShareLink', shortCode);
          setLoading(false);
          setError('Please log in to add this item to your collection');
          return;
        }

        const collectionsData = await collectionsRes.json();
        const collections: Collection[] = collectionsData.collections || [];

        // Handle collection sharing
        if (data.collectionUri) {
          // Redirect to the shared collection
          setTimeout(() => {
            navigate(`/collections/${encodeURIComponent(data.collectionUri!)}`);
          }, 2000);
          return;
        }

        // Handle media item sharing
        if (!data.mediaItemId) {
          throw new Error('Invalid share link data');
        }

        if (collections.length === 0) {
          // No collections - redirect to item page
          setTimeout(() => {
            navigate(`/items/${data.mediaItemId}`, {
              state: { recommendedBy: data.recommendedBy },
            });
          }, 2000);
          return;
        }

        // Get the first collection (default)
        const defaultCollection = collections[0];

        // Fetch media item details
        const mediaRes = await fetch(`${apiUrl}/media/${data.mediaItemId}`);
        if (!mediaRes.ok) {
          throw new Error('Failed to fetch media item');
        }
        const mediaItem: MediaItem = await mediaRes.json();

        // Redirect to collection with query params to open add modal
        setTimeout(() => {
          const params = new URLSearchParams({
            add: 'true',
            mediaId: data.mediaItemId!.toString(),
            mediaType: data.mediaType!,
            title: mediaItem.title,
            creator: mediaItem.creator || '',
            isbn: mediaItem.isbn || '',
            coverImage: mediaItem.coverImage || '',
            recommendedBy: recommender?.handle || data.recommendedBy,
          });
          
          navigate(`/collections/${encodeURIComponent(defaultCollection.uri)}?${params.toString()}`);
        }, 2000);
      } catch (err: any) {
        console.error('Share link resolution error:', err);
        setError(err.message || 'Failed to resolve share link');
        setLoading(false);
      }
    };

    resolveShareLink();
  }, [shortCode, apiUrl, navigate]);

  if (error) {
    const isAuthError = error.includes('log in');
    return (
      <Center py={12}>
        <VStack gap={6}>
          {isAuthError ? (
            <>
              <Box fontSize="6xl">✨</Box>
              <Text fontSize="xl" fontWeight="bold">
                Shared with you!
              </Text>
              {recommender && (
                <VStack gap={3}>
                  <Avatar
                    size="lg"
                    name={recommender.displayName || recommender.handle}
                    src={recommender.avatar}
                    fallback="👤"
                  />
                  <Text color="fg.muted" textAlign="center">
                    Recommended by
                  </Text>
                  <Text fontWeight="bold">
                    {recommender.displayName || recommender.handle}
                  </Text>
                  <Text color="fg.muted" fontSize="sm">
                    @{recommender.handle}
                  </Text>
                </VStack>
              )}
              <Text color="fg.muted" textAlign="center" maxW="md">
                {error}
              </Text>
              <Button
                colorPalette="teal"
                onClick={() => navigate('/')}
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <Box fontSize="6xl">😕</Box>
              <Text fontSize="xl" fontWeight="bold">
                Oops! Link not found
              </Text>
              <Text color="fg.muted" textAlign="center" maxW="md">
                {error}
              </Text>
              <Button
                colorPalette="teal"
                onClick={() => navigate('/')}
              >
                Go to Home
              </Button>
            </>
          )}
        </VStack>
      </Center>
    );
  }

  return (
    <Center py={12}>
      <VStack gap={6}>
        {loading ? (
          <>
            <Spinner size="xl" color="teal.500" />
            <Text fontSize="lg" fontWeight="medium">
              Loading recommendation...
            </Text>
          </>
        ) : shareData && (
          <>
            <Box fontSize="6xl">✨</Box>
            <Text fontSize="xl" fontWeight="bold">
              Shared with you!
            </Text>
            {recommender ? (
              <VStack gap={3}>
                <Avatar
                  size="lg"
                  name={recommender.displayName || recommender.handle}
                  src={recommender.avatar}
                  fallback="👤"
                />
                <Text color="fg.muted" textAlign="center">
                  Recommended by
                </Text>
                <Text fontWeight="bold">
                  {recommender.displayName || recommender.handle}
                </Text>
                <Text color="fg.muted" fontSize="sm">
                  @{recommender.handle}
                </Text>
              </VStack>
            ) : (
              <Text color="fg.muted">
                Someone shared this with you!
              </Text>
            )}
            <Spinner size="sm" color="teal.500" />
            <Text color="fg.muted" fontSize="sm">
              Redirecting...
            </Text>
          </>
        )}
      </VStack>
    </Center>
  );
}
