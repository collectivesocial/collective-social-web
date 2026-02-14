import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Badge,
  Table,
} from '@chakra-ui/react';
import { LuTrash2, LuX } from 'react-icons/lu';
import { AdminLayout } from '../../components/AdminLayout';

interface TagReport {
  id: number;
  item_id: number;
  tag_id: number;
  reporter_did: string;
  reason: string;
  created_at: string;
  status: string;
  tag_name: string;
  tag_slug: string;
  item_title: string;
  item_creator: string | null;
  item_media_type: string;
}

interface ReportCount {
  item_id: number;
  tag_id: number;
  report_count: number;
}

interface AdminTagReportsPageProps {
  apiUrl: string;
}

export function AdminTagReportsPage({ apiUrl }: AdminTagReportsPageProps) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<TagReport[]>([]);
  const [reportCounts, setReportCounts] = useState<ReportCount[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processing, setProcessing] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/admin/tag-reports?status=${statusFilter}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch tag reports, status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        if (response.status === 401 || response.status === 403) {
          navigate('/');
        }
        return;
      }

      const data = await response.json();
      setReports(data.reports);
      setReportCounts(data.reportCounts);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch tag reports:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [apiUrl, statusFilter]);

  const handleRemoveTag = async (reportId: number) => {
    if (!confirm('Remove this tag from the item? This will resolve all reports for this tag on this item.')) {
      return;
    }

    setProcessing(reportId);
    try {
      const response = await fetch(
        `${apiUrl}/admin/tag-reports/${reportId}/remove-tag`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove tag');
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
      alert('Failed to remove tag');
    } finally {
      setProcessing(null);
    }
  };

  const handleDismiss = async (reportId: number) => {
    if (!confirm('Dismiss this report? The tag will remain on the item.')) {
      return;
    }

    setProcessing(reportId);
    try {
      const response = await fetch(
        `${apiUrl}/admin/tag-reports/${reportId}/dismiss`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to dismiss report');
      }
    } catch (err) {
      console.error('Failed to dismiss report:', err);
      alert('Failed to dismiss report');
    } finally {
      setProcessing(null);
    }
  };

  const getReportCount = (itemId: number, tagId: number): number => {
    const count = reportCounts.find(
      (rc) => rc.item_id === itemId && rc.tag_id === tagId
    );
    return count ? count.report_count : 1;
  };

  // Group reports by item and tag
  const groupedReports = reports.reduce((acc, report) => {
    const key = `${report.item_id}-${report.tag_id}`;
    if (!acc[key]) {
      acc[key] = {
        itemId: report.item_id,
        tagId: report.tag_id,
        tagName: report.tag_name,
        itemTitle: report.item_title,
        itemCreator: report.item_creator,
        itemMediaType: report.item_media_type,
        reports: [],
      };
    }
    acc[key].reports.push(report);
    return acc;
  }, {} as Record<string, { itemId: number; tagId: number; tagText: string; itemTitle: string; reports: TagReport[] }>);

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Loading tag reports...</Text>
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
          <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading">Tag Reports</Heading>
          <Badge colorPalette="red" size="lg" px={4} py={2}>
            Pending: {reportCounts.reduce((sum, rc) => sum + rc.report_count, 0)}
          </Badge>
        </Flex>

        <Flex mb={4} gap={2} wrap="wrap">
          <Button
            onClick={() => setStatusFilter('pending')}
            colorPalette={statusFilter === 'pending' ? 'accent' : 'gray'}
            variant="outline"
            bg="transparent"
            size="sm"
          >
            Pending
          </Button>
          <Button
            onClick={() => setStatusFilter('resolved')}
            colorPalette={statusFilter === 'resolved' ? 'accent' : 'gray'}
            variant="outline"
            bg="transparent"
            size="sm"
          >
            Resolved
          </Button>
          <Button
            onClick={() => setStatusFilter('dismissed')}
            colorPalette={statusFilter === 'dismissed' ? 'accent' : 'gray'}
            variant="outline"
            bg="transparent"
            size="sm"
          >
            Dismissed
          </Button>
          <Button
            onClick={() => setStatusFilter('all')}
            colorPalette={statusFilter === 'all' ? 'accent' : 'gray'}
            variant="outline"
            bg="transparent"
            size="sm"
          >
            All
          </Button>
        </Flex>

        <VStack gap={4} align="stretch">
          {Object.values(groupedReports).map((group: { itemId: number; tagId: number; tagText: string; itemTitle: string; reports: TagReport[] }) => {
            const reportCount = getReportCount(group.itemId, group.tagId);
            const firstReport = group.reports[0];

            return (
              <Box
                key={`${group.itemId}-${group.tagId}`}
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.card"
                borderRadius="xl"
                p={{ base: 4, md: 6 }}
              >
                <Flex
                  justify="space-between"
                  align="flex-start"
                  mb={4}
                  gap={4}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Box flex="1">
                    <Flex align="center" gap={2} mb={2}>
                      <Badge
                        colorPalette="red"
                        size="lg"
                        fontWeight="bold"
                      >
                        {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
                      </Badge>
                      <Badge
                        colorPalette="accent"
                        textTransform="capitalize"
                      >
                        {group.itemMediaType}
                      </Badge>
                    </Flex>
                    <Heading size="md" fontFamily="heading" mb={1}>
                      Tag: <Badge colorPalette="orange" fontSize="md">{group.tagName}</Badge>
                    </Heading>
                    <Text fontSize="sm" color="fg.muted" mb={2}>
                      On: <strong>{group.itemTitle}</strong>
                      {group.itemCreator && ` by ${group.itemCreator}`}
                    </Text>
                  </Box>

                  {statusFilter === 'pending' && (
                    <HStack gap={2}>
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="solid"
                        onClick={() => handleRemoveTag(firstReport.id)}
                        disabled={processing === firstReport.id}
                      >
                        <LuTrash2 /> Remove Tag
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDismiss(firstReport.id)}
                        disabled={processing === firstReport.id}
                      >
                        <LuX /> Dismiss
                      </Button>
                    </HStack>
                  )}
                </Flex>

                <Box
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderRadius="md"
                  overflow="hidden"
                >
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>Reporter</Table.ColumnHeader>
                        <Table.ColumnHeader>Reason</Table.ColumnHeader>
                        <Table.ColumnHeader>Date</Table.ColumnHeader>
                        {statusFilter !== 'pending' && (
                          <Table.ColumnHeader>Status</Table.ColumnHeader>
                        )}
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {group.reports.map((report: TagReport) => (
                        <Table.Row key={report.id}>
                          <Table.Cell fontSize="xs" fontFamily="mono">
                            {report.reporter_did.substring(0, 20)}...
                          </Table.Cell>
                          <Table.Cell fontSize="sm">{report.reason}</Table.Cell>
                          <Table.Cell fontSize="sm">
                            {new Date(report.created_at).toLocaleDateString()}
                          </Table.Cell>
                          {statusFilter !== 'pending' && (
                            <Table.Cell>
                              <Badge
                                colorPalette={
                                  report.status === 'resolved'
                                    ? 'green'
                                    : report.status === 'dismissed'
                                    ? 'gray'
                                    : 'orange'
                                }
                                size="sm"
                                textTransform="capitalize"
                              >
                                {report.status}
                              </Badge>
                            </Table.Cell>
                          )}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            );
          })}

          {reports.length === 0 && (
            <Center py={12}>
              <VStack gap={2}>
                <Text fontSize="lg" fontWeight="medium">
                  No {statusFilter !== 'all' && statusFilter} reports
                </Text>
                <Text color="fg.muted" fontSize="sm">
                  {statusFilter === 'pending'
                    ? 'All clear! No pending tag reports to review.'
                    : `No ${statusFilter} reports found.`}
                </Text>
              </VStack>
            </Center>
          )}
        </VStack>
      </Box>
    </AdminLayout>
  );
}
