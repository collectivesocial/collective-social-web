import { useState } from 'react';
import { Box, Button, VStack, Text, Textarea } from '@chakra-ui/react';
import { LuFlag } from 'react-icons/lu';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogBackdrop,
  DialogPositioner,
  DialogCloseTrigger,
} from './ui/dialog';
import { Field } from './ui/field';

interface ReportTagModalProps {
  apiUrl: string;
  itemId: number;
  tagId: number;
  tagName: string;
  onReported: () => void;
}

const REPORT_REASONS = [
  'Inappropriate or offensive content',
  'Spam or misleading',
  'Incorrect or irrelevant tag',
  'Duplicate tag',
  'Other',
];

export function ReportTagModal({
  apiUrl,
  itemId,
  tagId,
  tagName,
  onReported,
}: ReportTagModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;

    if (!reason.trim()) {
      alert('Please select or provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${apiUrl}/media/${itemId}/tags/${tagId}/report`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        setOpen(false);
        setSelectedReason('');
        setCustomReason('');
        onReported();
        alert('Thank you for reporting. Our moderators will review this tag.');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit report');
      }
    } catch (err) {
      console.error('Failed to report tag:', err);
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="xs"
        variant="ghost"
        bg="transparent"
        onClick={() => setOpen(true)}
        title="Report this tag"
      >
        <LuFlag size={12} />
      </Button>

      <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Tag: {tagName}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color="fg.muted">
                  Help us maintain quality by reporting inappropriate or incorrect
                  tags. Your report will be reviewed by our moderation team.
                </Text>

                <Field label="Reason for reporting">
                  <VStack align="stretch" gap={2}>
                    {REPORT_REASONS.map((reason) => (
                      <Box
                        key={reason}
                        p={3}
                        borderWidth="1px"
                        borderRadius="md"
                        cursor="pointer"
                        bg={selectedReason === reason ? 'teal.50' : 'transparent'}
                        borderColor={
                          selectedReason === reason ? 'teal.500' : 'border'
                        }
                        _hover={{ borderColor: 'teal.500' }}
                        onClick={() => setSelectedReason(reason)}
                      >
                        <Text fontSize="sm">{reason}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Field>

                {selectedReason === 'Other' && (
                  <Field label="Please specify">
                    <Textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Describe the issue with this tag..."
                      rows={3}
                    />
                  </Field>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" bg="transparent" onClick={() => setOpen(false)} mr={3}>
                Cancel
              </Button>
              <Button
                colorPalette="red"
                bg="transparent"
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </>
  );
}
