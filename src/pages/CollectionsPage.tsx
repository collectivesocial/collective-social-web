import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Flex,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Spinner,
  Center,
  Box,
} from '@chakra-ui/react';
import { CollectionCard } from '../components/CollectionCard';
import { CollectionModal } from '../components/CollectionModal';
import { EmptyState } from '../components/EmptyState';

interface UserProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

interface Collection {
  uri: string;
  name: string;
  description: string | null;
  visibility?: 'public' | 'private';
  isDefault?: boolean;
  purpose: string;
  avatar: string | null;
  itemCount: number;
  createdAt: string;
}

interface CollectionsPageProps {
  apiUrl: string;
}

export function CollectionsPage({ apiUrl }: CollectionsPageProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
    purpose: 'app.collectivesocial.defs#curatelist',
  });
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    visibility: 'public' as 'public' | 'private',
  });
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/users/me`, {
        credentials: 'include',
      }),
      fetch(`${apiUrl}/collections`, {
        credentials: 'include',
      }),
    ])
      .then(async ([userRes, collectionsRes]) => {
        if (!userRes.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await userRes.json();
        const collectionsData = collectionsRes.ok
          ? await collectionsRes.json()
          : { collections: [] };

        setUser(userData);
        setCollections(collectionsData.collections);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        navigate('/');
      });
  }, [apiUrl, navigate]);

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setEditData({
      name: collection.name,
      description: collection.description || '',
      visibility: collection.visibility || 'public',
    });
    setShowEditModal(true);
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCollection) return;

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(editingCollection.uri)}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update collection');
      }

      // Refresh collections
      const collectionsRes = await fetch(`${apiUrl}/collections`, {
        credentials: 'include',
      });
      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json();
        setCollections(collectionsData.collections);
      }

      setShowEditModal(false);
      setEditingCollection(null);
    } catch (err) {
      console.error('Failed to update collection:', err);
      alert('Failed to update collection');
    }
  };

  const handleDeleteCollection = async (collection: Collection) => {
    if (collection.isDefault) {
      alert('Cannot delete the default Inbox list');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/collections/${encodeURIComponent(collection.uri)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete collection');
      }

      setCollections(collections.filter((c) => c.uri !== collection.uri));
    } catch (err: any) {
      console.error('Failed to delete collection:', err);
      alert(err.message || 'Failed to delete collection');
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${apiUrl}/collections`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCollection),
      });

      if (!response.ok) {
        throw new Error('Failed to create collection');
      }

      const created = await response.json();

      setCollections([
        ...collections,
        {
          ...created,
          itemCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);

      setShowCreateModal(false);
      setNewCollection({
        name: '',
        description: '',
        visibility: 'public',
        purpose: 'app.collectivesocial.defs#curatelist',
      });
    } catch (err) {
      console.error('Failed to create collection:', err);
      alert('Failed to create collection');
    }
  };

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  if (error || !user) {
    return (
      <Container maxW="container.md" py={20}>
        <Center>
          <Text color="fg.error" fontSize="lg">
            Error: {error || 'Unable to load collections'}
          </Text>
        </Center>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Flex
        direction="column"
        justify="space-between"
        align={{ base: 'flex-start', md: 'center' }}
        gap={4}
        mb={8}
      >
        <Box>
          <Heading size={{ base: 'xl', md: '2xl' }} mb={2}>
            Collections
          </Heading>
          <Text color="fg.muted">
            Your curated groups of content
          </Text>
        </Box>
        <Button
          colorPalette="teal"
          bg="teal"
          onClick={() => setShowCreateModal(true)}
          flexShrink={0}
          w={{ base: 'full', md: 'auto' }}
        >
          + New Collection
        </Button>
      </Flex>

      {collections.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No collections yet"
          description="Collections let you organize and curate media like books, movies, and blog posts."
        />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
          {collections.map((collection) => (
            <CollectionCard
              key={collection.uri}
              collection={collection}
              onEdit={handleEditCollection}
              onDelete={handleDeleteCollection}
            />
          ))}
        </SimpleGrid>
      )}


      <CollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCollection}
        formData={newCollection}
        onChange={(data) => setNewCollection({ ...data, purpose: 'app.collectivesocial.defs#curatelist' })}
        title="Create New Collection"
        submitLabel="Create"
      />

      <CollectionModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateCollection}
        formData={editData}
        onChange={setEditData}
        title="Edit Collection"
        submitLabel="Save Changes"
        isDefault={editingCollection?.isDefault}
      />
    </Container>
  );
}
