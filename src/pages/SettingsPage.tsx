import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Portal,
  HStack,
  Flex,
  IconButton,
  Spinner,
  Link,
  Table,
} from '@chakra-ui/react';
import { Field } from '../components/ui/field';
import {
  DialogActionTrigger,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { toaster } from '../components/ui/toaster';
import { LuCopy, LuTrash2, LuExternalLink } from 'react-icons/lu';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface ShareLink {
  id: number;
  shortCode: string;
  mediaItemId: number | null;
  mediaType: string | null;
  collectionUri: string | null;
  collectionName: string | null;
  reviewId: number | null;
  timesClicked: number;
  createdAt: string;
  updatedAt: string;
  title: string | null;
  creator: string | null;
  coverImage: string | null;
  url: string;
}

interface SettingsPageProps {
  apiUrl: string;
  user: UserProfile | null;
}

export function SettingsPage({ apiUrl, user }: SettingsPageProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmHandle, setConfirmHandle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  useEffect(() => {
    const fetchShareLinks = async () => {
      try {
        const response = await fetch(`${apiUrl}/share/user/links`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setShareLinks(data.links || []);
        }
      } catch (error) {
        console.error('Failed to fetch share links:', error);
      } finally {
        setLoadingLinks(false);
      }
    };

    fetchShareLinks();
  }, [apiUrl]);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toaster.success({
        title: 'Link copied!',
        description: 'Share link has been copied to clipboard.',
      });
    } catch {
      toaster.error({
        title: 'Copy failed',
        description: 'Unable to copy link to clipboard.',
      });
    }
  };

  const handleDeleteShareLink = async (linkId: number) => {
    try {
      const response = await fetch(`${apiUrl}/share/user/links/${linkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setShareLinks((prev) => prev.filter((link) => link.id !== linkId));
        toaster.success({
          title: 'Link deleted',
          description: 'Share link has been removed.',
        });
      } else {
        throw new Error('Failed to delete link');
      }
    } catch (error) {
      console.error('Error deleting share link:', error);
      toaster.error({
        title: 'Deletion failed',
        description: 'Unable to delete share link. Please try again.',
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || confirmHandle !== user.handle) {
      toaster.error({
        title: 'Handle does not match',
        description: 'Please type your handle correctly to confirm deletion.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiUrl}/users/me`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toaster.success({
          title: 'Account deleted',
          description: 'Your account and all data have been permanently deleted.',
        });
        // Redirect to home page after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toaster.error({
        title: 'Deletion failed',
        description: 'Unable to delete your account. Please try again.',
      });
      setIsDeleting(false);
    }
  };

  const handleDialogClose = () => {
    if (!isDeleting) {
      setIsDeleteDialogOpen(false);
      setConfirmHandle('');
    }
  };

  return (
    <Container maxW="container.md" py={{ base: 4, md: 8 }}>
      <VStack gap={{ base: 6, md: 8 }} align="stretch">
        <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading">
          Settings
        </Heading>

        {/* Share Links Section */}
        <Box
          bg="bg.card"
          borderWidth="1px"
          borderColor="border.card"
          borderRadius="xl"
          p={{ base: 4, md: 6 }}
        >
          <VStack align="stretch" gap={4}>
            <Heading size="lg" fontFamily="heading">Your Share Links</Heading>
            <Text color="fg.muted" fontSize="sm">
              Manage your shared item links. These links allow others to quickly add items you've recommended to their collections.
            </Text>

            {loadingLinks ? (
              <Flex justify="center" py={8}>
                <Spinner size="lg" color="accent.default" />
              </Flex>
            ) : shareLinks.length === 0 ? (
              <Box
                p={8}
                bg="bg.muted"
                borderRadius="md"
                textAlign="center"
              >
                <Text color="fg.muted">
                  You haven't created any share links yet. Click the share button on any item to create one!
                </Text>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Item</Table.ColumnHeader>
                      <Table.ColumnHeader>Share Link</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Clicks</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center">Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {shareLinks.map((link) => (
                      <Table.Row key={link.id}>
                        <Table.Cell>
                          {link.collectionUri ? (
                            // Collection link
                            <Link
                              onClick={() => navigate(`/collections/${encodeURIComponent(link.collectionUri!)}`)}
                              color="accent.default"
                              fontWeight="medium"
                              cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                            >
                              <HStack gap={1}>
                                <Text>{link.collectionName || 'Untitled Collection'}</Text>
                                <LuExternalLink size={14} />
                              </HStack>
                            </Link>
                          ) : link.reviewId ? (
                            // Review link
                            <Link
                              onClick={() => navigate(`/items/${link.mediaItemId}?reviewId=${link.reviewId}`)}
                              color="accent.default"
                              fontWeight="medium"
                              cursor="pointer"
                              _hover={{ textDecoration: 'underline' }}
                            >
                              <HStack gap={1}>
                                <Text>{link.title || 'Review'}</Text>
                                <LuExternalLink size={14} />
                              </HStack>
                            </Link>
                          ) : (
                            // Media item link
                            <>
                              <Link
                                onClick={() => navigate(`/items/${link.mediaItemId}`)}
                                color="accent.default"
                                fontWeight="medium"
                                cursor="pointer"
                                _hover={{ textDecoration: 'underline' }}
                              >
                                <HStack gap={1}>
                                  <Text>{link.title || 'Untitled'}</Text>
                                  <LuExternalLink size={14} />
                                </HStack>
                              </Link>
                              {link.creator && (
                                <Text fontSize="xs" color="fg.muted">
                                  by {link.creator}
                                </Text>
                              )}
                            </>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={2}>
                            <Text
                              fontSize="xs"
                              fontFamily="mono"
                              color="fg.muted"
                              maxW={{ base: '150px', md: '300px' }}
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {link.url}
                            </Text>
                            <IconButton
                              aria-label="Copy link"
                              onClick={() => handleCopyLink(link.url)}
                              colorPalette="accent"
                              variant="ghost"
                              background="transparent"
                              size="xs"
                            >
                              <LuCopy />
                            </IconButton>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <Text fontWeight="bold">{link.timesClicked}</Text>
                        </Table.Cell>
                        <Table.Cell textAlign="center">
                          <IconButton
                            aria-label="Delete link"
                            onClick={() => handleDeleteShareLink(link.id)}
                            colorPalette="red"
                            variant="ghost"
                            background="transparent"
                            size="xs"
                          >
                            <LuTrash2 />
                          </IconButton>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Danger Zone Section */}
        <Box
          bg="bg.card"
          borderWidth="2px"
          borderColor="red.500"
          borderRadius="xl"
          p={{ base: 4, md: 6 }}
          mt={{ base: 8, md: 12 }}
        >
          <VStack align="stretch" gap={4}>
            <Heading size="lg" color="red.500" fontFamily="heading">
              Danger Zone
            </Heading>
            <Text color="fg.muted">
              These actions are permanent and cannot be undone. Please proceed with caution.
            </Text>

            <Box
              p={4}
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border.card"
              borderRadius="lg"
            >
              <VStack align="stretch" gap={3}>
                <Heading size="md" fontFamily="heading">Delete Account</Heading>
                <Text fontSize="sm" color="fg.muted">
                  Permanently delete your account and all associated data including collections, reviews, and settings.
                </Text>

                <DialogRoot
                  open={isDeleteDialogOpen}
                  onOpenChange={(e: { open: boolean }) => !isDeleting && setIsDeleteDialogOpen(e.open)}
                  size={{ base: 'xs', md: 'md' }}
                >
                  <DialogTrigger asChild>
                    <Button
                      colorPalette="red"
                      size="sm"
                      mt={2}
                    >
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <Portal>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogCloseTrigger disabled={isDeleting} />
                      </DialogHeader>
                      <DialogBody>
                        <VStack align="stretch" gap={4}>
                          <Text>
                            This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all your data from our servers.
                          </Text>
                          <Text>
                            This will <strong>not</strong> delete any content stored in your PDS, only the content that is on our servers.
                          </Text>
                          <Text fontWeight="bold">
                            All of the following will be deleted:
                          </Text>
                          <Box as="ul" pl={6}>
                            <li>Your user account information stored in our databases</li>
                            <li>Your review and rating references stored in our databases</li>
                            <li>Your profile information related to this application</li>
                            <li>All settings and preferences</li>
                          </Box>
                          <Field
                            label={`Please type your handle "${user?.handle}" to confirm`}
                            invalid={confirmHandle.length > 0 && confirmHandle !== user?.handle}
                            errorText="Handle does not match"
                          >
                            <Input
                              value={confirmHandle}
                              onChange={(e) => setConfirmHandle(e.target.value)}
                              placeholder={user?.handle}
                              disabled={isDeleting}
                              autoComplete="off"
                            />
                          </Field>
                        </VStack>
                      </DialogBody>
                      <DialogFooter>
                        <DialogActionTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={isDeleting}
                            onClick={handleDialogClose}
                          >
                            Cancel
                          </Button>
                        </DialogActionTrigger>
                        <Button
                          colorPalette="red"
                          onClick={handleDeleteAccount}
                          disabled={confirmHandle !== user?.handle}
                          loading={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete My Account'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Portal>
                </DialogRoot>
              </VStack>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}
