import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { AdminLayout } from '../../components/AdminLayout';
import { MediaManagement } from '../../components/MediaManagement';

interface AdminMediaItemsPageProps {
  apiUrl: string;
}

export function AdminMediaItemsPage({ apiUrl }: AdminMediaItemsPageProps) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const adminCheckRes = await fetch(`${apiUrl}/admin/check`, {
          credentials: 'include',
        });

        if (!adminCheckRes.ok) {
          navigate('/');
          return;
        }

        const adminData = await adminCheckRes.json();
        if (!adminData.isAdmin) {
          navigate('/');
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to check admin status:', err);
        navigate('/');
      }
    };

    checkAdmin();
  }, [apiUrl, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Loading media items...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading" mb={6}>
          Media Items
        </Heading>
        <MediaManagement apiUrl={apiUrl} />
      </Box>
    </AdminLayout>
  );
}
