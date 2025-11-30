import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Input,
  Portal,
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

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
}

interface SettingsPageProps {
  apiUrl: string;
  user: UserProfile | null;
}

export function SettingsPage({ apiUrl, user }: SettingsPageProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmHandle, setConfirmHandle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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
        <Heading size={{ base: 'xl', md: '2xl' }}>
          Settings
        </Heading>

        {/* Danger Zone Section */}
        <Box
          bg="bg.subtle"
          borderWidth="2px"
          borderColor="red.500"
          borderRadius="lg"
          p={{ base: 4, md: 6 }}
          mt={{ base: 8, md: 12 }}
        >
          <VStack align="stretch" gap={4}>
            <Heading size="lg" color="red.500">
              Danger Zone
            </Heading>
            <Text color="fg.muted">
              These actions are permanent and cannot be undone. Please proceed with caution.
            </Text>

            <Box
              p={4}
              bg="bg.muted"
              borderWidth="1px"
              borderColor="border"
              borderRadius="md"
            >
              <VStack align="stretch" gap={3}>
                <Heading size="md">Delete Account</Heading>
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
