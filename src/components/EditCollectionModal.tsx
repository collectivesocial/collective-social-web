import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Text,
  VStack,
  HStack,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogPositioner,
} from './ui/dialog';
import { Field } from './ui/field';

interface EditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionName: string;
  collectionDescription: string | null;
  onSave: (name: string, description: string | null) => Promise<void>;
}

export function EditCollectionModal({
  isOpen,
  onClose,
  collectionName,
  collectionDescription,
  onSave,
}: EditCollectionModalProps) {
  // Use a key on the DialogRoot to reset state when opening with new values
  const [name, setName] = useState(collectionName);
  const [description, setDescription] = useState(collectionDescription || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Collection name is required');
      return;
    }

    try {
      await onSave(name, description || null);
      onClose();
    } catch (err) {
      console.error('Failed to update collection:', err);
      alert('Failed to update collection');
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} key={`${collectionName}-${collectionDescription}`}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="600px">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Field label="Collection Name" required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter collection name"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description for this collection"
                    rows={4}
                    resize="vertical"
                    maxLength={3000}
                  />
                  <Text fontSize="sm" color="fg.muted" mt={1}>
                    {description.length} / 3000 characters
                  </Text>
                </Field>
              </VStack>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button onClick={onClose} variant="outline" bg="transparent">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorPalette="accent"
                  variant="outline"
                  bg="transparent"
                >
                  Save Changes
                </Button>
              </HStack>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
