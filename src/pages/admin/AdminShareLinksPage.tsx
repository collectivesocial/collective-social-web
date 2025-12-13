import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
  Badge,
  Table,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { EmptyState } from '../../components/EmptyState';
import { AdminLayout } from '../../components/AdminLayout';

interface ShareLink {
  id: number;
  shortCode: string;
  userDid: string;
  userHandle: string | null;
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

interface AdminShareLinksPageProps {
  apiUrl: string;
}

export function AdminShareLinksPage({ apiUrl }: AdminShareLinksPageProps) {
  const [loading, setLoading] = useState(true);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [totalShareLinks, setTotalShareLinks] = useState(0);
  const [shareLinksPage, setShareLinksPage] = useState(1);
  const [shareLinksPerPage] = useState(20);
  const [shareLinksSortBy, setShareLinksSortBy] = useState<
    'timesClicked' | 'createdAt'
  >('timesClicked');
  const [shareLinksOrder, setShareLinksOrder] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShareLinks = async () => {
      try {
        const response = await fetch(
          `${apiUrl}/admin/share-links?page=${shareLinksPage}&limit=${shareLinksPerPage}&sortBy=${shareLinksSortBy}&order=${shareLinksOrder}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          navigate('/');
          return;
        }

        const data = await response.json();
        setShareLinks(data.links);
        setTotalShareLinks(data.totalLinks);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch share links:', err);
        navigate('/');
      }
    };

    fetchShareLinks();
  }, [
    apiUrl,
    navigate,
    shareLinksPage,
    shareLinksPerPage,
    shareLinksSortBy,
    shareLinksOrder,
  ]);

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="teal.500" />
            <Text color="fg.muted">Loading share links...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          direction={{ base: 'column', sm: 'row' }}
          gap={{ base: 3, sm: 0 }}
        >
          <Heading size={{ base: 'xl', md: '2xl' }}>Share Links</Heading>
          <Badge colorPalette="gray" size="lg" px={4} py={2}>
            Total: {totalShareLinks}
          </Badge>
        </Flex>

        <Flex mb={4} gap={2} wrap="wrap">
          <Button
            onClick={() => {
              setShareLinksSortBy('timesClicked');
              setShareLinksOrder('desc');
              setShareLinksPage(1);
            }}
            colorPalette="teal"
            variant="outline"
            color={shareLinksSortBy === 'timesClicked' ? 'teal' : 'gray'}
            bg="transparent"
            size="sm"
          >
            Most Clicked
          </Button>
          <Button
            onClick={() => {
              setShareLinksSortBy('createdAt');
              setShareLinksOrder('desc');
              setShareLinksPage(1);
            }}
            colorPalette="teal"
            variant="outline"
            color={shareLinksSortBy === 'createdAt' ? 'teal' : 'gray'}
            bg="transparent"
            size="sm"
          >
            Newest
          </Button>
        </Flex>

        <Box
          bg="bg.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          overflow={{ base: 'auto', md: 'hidden' }}
        >
          <Table.Root size={{ base: 'sm', md: 'md' }}>
            <Table.Header>
              <Table.Row bg="bg.muted">
                <Table.ColumnHeader color="fg.muted" fontWeight="medium">
                  Item
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  display={{ base: 'none', sm: 'table-cell' }}
                >
                  User
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  display={{ base: 'none', md: 'table-cell' }}
                >
                  Share Link
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  textAlign="center"
                >
                  Clicks
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="fg.muted"
                  fontWeight="medium"
                  display={{ base: 'none', lg: 'table-cell' }}
                >
                  Created
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {shareLinks.map((link) => (
                <Table.Row key={link.id}>
                  <Table.Cell>
                    {link.collectionUri ? (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          {link.collectionName || 'Untitled Collection'}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          Collection
                        </Text>
                      </Box>
                    ) : link.title ? (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          {link.title}
                        </Text>
                        {link.creator && (
                          <Text fontSize="xs" color="fg.muted">
                            {link.creator}
                          </Text>
                        )}
                      </Box>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        Unknown Item
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell display={{ base: 'none', sm: 'table-cell' }}>
                    {link.userHandle ? (
                      <ChakraLink
                        onClick={() => navigate(`/profile/${link.userDid}`)}
                        color="teal.500"
                        fontSize="sm"
                        cursor="pointer"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        @{link.userHandle}
                      </ChakraLink>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">Unknown User</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell
                    fontFamily="mono"
                    fontSize="xs"
                    display={{ base: 'none', md: 'table-cell' }}
                  >
                    {link.url}
                  </Table.Cell>
                  <Table.Cell textAlign="center">
                    <Text fontSize="sm" fontWeight="bold">
                      {link.timesClicked}
                    </Text>
                  </Table.Cell>
                  <Table.Cell
                    fontSize="sm"
                    display={{ base: 'none', lg: 'table-cell' }}
                  >
                    {new Date(link.createdAt).toLocaleDateString()}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {shareLinks.length === 0 && (
          <Box mt={4}>
            <EmptyState
              title="No share links yet"
              description="Share links created by users will appear here"
            />
          </Box>
        )}

        {totalShareLinks > shareLinksPerPage && (
          <Flex mt={4} justify="space-between" align="center" gap={4}>
            <Button
              onClick={() => setShareLinksPage(shareLinksPage - 1)}
              disabled={shareLinksPage === 1}
              size="sm"
              variant="outline"
            >
              Previous
            </Button>
            <Text fontSize="sm" color="fg.muted">
              Page {shareLinksPage} of{' '}
              {Math.ceil(totalShareLinks / shareLinksPerPage)}
            </Text>
            <Button
              onClick={() => setShareLinksPage(shareLinksPage + 1)}
              disabled={
                shareLinksPage >= Math.ceil(totalShareLinks / shareLinksPerPage)
              }
              size="sm"
              variant="outline"
            >
              Next
            </Button>
          </Flex>
        )}
      </Box>
    </AdminLayout>
  );
}
