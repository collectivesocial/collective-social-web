import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
  SimpleGrid,
  Table,
  Badge,
} from '@chakra-ui/react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AdminLayout } from '../../components/AdminLayout';

interface WeeklyDataPoint {
  week: string;
  count: number;
}

interface ItemsPerUserRow {
  did: string;
  handle: string | null;
  count: number;
}

interface RetentionRow {
  cohortWeek: string;
  signups: number;
  retained: number;
  retentionPct: number;
}

interface AdminAnalyticsPageProps {
  apiUrl: string;
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.card"
      borderRadius="lg"
      p={{ base: 4, md: 6 }}
    >
      <Heading size="md" mb={4} fontFamily="heading">
        {title}
      </Heading>
      {children}
    </Box>
  );
}

export function AdminAnalyticsPage({ apiUrl }: AdminAnalyticsPageProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [signups, setSignups] = useState<WeeklyDataPoint[]>([]);
  const [wau, setWau] = useState<WeeklyDataPoint[]>([]);
  const [itemsPerUser, setItemsPerUser] = useState<ItemsPerUserRow[]>([]);
  const [bskyShares, setBskyShares] = useState<WeeklyDataPoint[]>([]);
  const [retention, setRetention] = useState<RetentionRow[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Verify admin access first
        const check = await fetch(`${apiUrl}/admin/check`, {
          credentials: 'include',
        });
        if (!check.ok) {
          navigate('/');
          return;
        }
        const checkData = await check.json();
        if (!checkData.isAdmin) {
          navigate('/');
          return;
        }

        // Fetch all analytics data in parallel
        const [signupsRes, wauRes, itemsRes, sharesRes, retentionRes] =
          await Promise.all([
            fetch(`${apiUrl}/analytics/signups-per-week`, {
              credentials: 'include',
            }),
            fetch(`${apiUrl}/analytics/weekly-active-users`, {
              credentials: 'include',
            }),
            fetch(`${apiUrl}/analytics/items-per-user`, {
              credentials: 'include',
            }),
            fetch(`${apiUrl}/analytics/bluesky-shares-per-week`, {
              credentials: 'include',
            }),
            fetch(`${apiUrl}/analytics/retention`, {
              credentials: 'include',
            }),
          ]);

        if (signupsRes.ok) {
          const d = await signupsRes.json();
          setSignups(d.data);
        }
        if (wauRes.ok) {
          const d = await wauRes.json();
          setWau(d.data);
        }
        if (itemsRes.ok) {
          const d = await itemsRes.json();
          setItemsPerUser(d.data);
        }
        if (sharesRes.ok) {
          const d = await sharesRes.json();
          setBskyShares(d.data);
        }
        if (retentionRes.ok) {
          const d = await retentionRes.json();
          setRetention(d.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [apiUrl, navigate]);

  if (loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <VStack gap={4}>
            <Spinner size="xl" color="accent.default" />
            <Text color="fg.muted">Loading analytics...</Text>
          </VStack>
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Heading size={{ base: 'xl', md: '2xl' }} fontFamily="heading" mb={6}>
          Analytics Dashboard
        </Heading>

        <VStack gap={6} align="stretch">
          {/* Top row: Sign-ups and WAU side by side */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            {/* Sign-ups per week */}
            <ChartCard title="Sign-ups per Week">
              {signups.length === 0 ? (
                <Text color="fg.muted" fontSize="sm">
                  No sign-up data yet.
                </Text>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={signups.map((d) => ({
                      ...d,
                      label: formatWeek(d.week),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Sign-ups"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Weekly Active Users */}
            <ChartCard title="Weekly Active Users">
              {wau.length === 0 ? (
                <Text color="fg.muted" fontSize="sm">
                  No activity data yet. Data will appear as users interact with
                  the app.
                </Text>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={wau.map((d) => ({
                      ...d,
                      label: formatWeek(d.week),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </SimpleGrid>

          {/* Bluesky Shares per week */}
          <ChartCard title="Bluesky Shares per Week">
            {bskyShares.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No Bluesky share data yet. Data will appear when users share
                content to Bluesky.
              </Text>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={bskyShares.map((d) => ({
                    ...d,
                    label: formatWeek(d.week),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Bluesky Shares"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Items per user (bar chart — top 20) */}
          <ChartCard title="Items Added per User (Top 20)">
            {itemsPerUser.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No item activity data yet. Data will appear as the eventType
                field is populated on new feed events.
              </Text>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={itemsPerUser.slice(0, 20).map((d) => ({
                    ...d,
                    label: d.handle
                      ? `@${d.handle}`
                      : `${d.did.substring(0, 16)}...`,
                  }))}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    fontSize={11}
                    width={110}
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                    name="Items"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* 7-Day Retention by Cohort */}
          <ChartCard title="7-Day Retention by Sign-up Cohort">
            {retention.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No retention data yet. Cohorts need to be at least 7 days old to
                appear.
              </Text>
            ) : (
              <Box
                overflowX="auto"
                borderWidth="1px"
                borderColor="border.card"
                borderRadius="md"
              >
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="bg.subtle">
                      <Table.ColumnHeader
                        color="fg.muted"
                        fontWeight="medium"
                      >
                        Cohort Week
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        color="fg.muted"
                        fontWeight="medium"
                        textAlign="right"
                      >
                        Sign-ups
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        color="fg.muted"
                        fontWeight="medium"
                        textAlign="right"
                      >
                        Returned after 7d
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        color="fg.muted"
                        fontWeight="medium"
                        textAlign="right"
                      >
                        Retention %
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {retention.map((row) => (
                      <Table.Row key={row.cohortWeek}>
                        <Table.Cell fontSize="sm">
                          {formatWeek(row.cohortWeek)}
                        </Table.Cell>
                        <Table.Cell fontSize="sm" textAlign="right">
                          {row.signups}
                        </Table.Cell>
                        <Table.Cell fontSize="sm" textAlign="right">
                          {row.retained}
                        </Table.Cell>
                        <Table.Cell textAlign="right">
                          <Badge
                            colorPalette={
                              row.retentionPct >= 40
                                ? 'green'
                                : row.retentionPct >= 20
                                  ? 'yellow'
                                  : 'red'
                            }
                            size="sm"
                          >
                            {row.retentionPct}%
                          </Badge>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </ChartCard>
        </VStack>
      </Box>
    </AdminLayout>
  );
}
