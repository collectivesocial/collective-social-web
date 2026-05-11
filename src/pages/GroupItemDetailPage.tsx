import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { safeFormatDateLong } from '../utils/time';
import { canSeeDiscussion as checkCanSeeDiscussion } from '../utils/discussion';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Badge,
  Spinner,
  Center,
  Input,
  Textarea,
  Image,
  chakra,
  Menu,
  IconButton,
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
} from '../components/ui/dialog';
import { Field } from '../components/ui/field';
import { EmptyState } from '../components/EmptyState';
import { ItemModal, type Collection } from '../components/ItemModal';
import { toaster } from '../components/ui/toaster';

// ── Interfaces ───────────────────────────────────────────────────

interface CollectionPermission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface ItemRecord {
  uri: string;
  rkey: string;
  listUri: string;
  title: string;
  creator?: string;
  mediaItemId?: number;
  mediaType: string;
  order: number;
  addedBy: string;
  status: string;
  createdAt: string;
}

interface Segment {
  uri: string;
  rkey: string;
  listItemUri: string;
  label: string;
  segmentType?: string;
  startPage?: number;
  endPage?: number;
  startPercent?: number;
  endPercent?: number;
  startChapter?: number;
  endChapter?: number;
  assignedDate?: string;
  order: number;
  createdBy: string;
  createdAt: string;
}

interface SegmentEvent {
  uri: string;
  cid: string;
  rkey: string;
  name: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  mode?: string;
  status?: string;
  segmentUri?: string;
  locations?: Array<{ name?: string; locality?: string; region?: string; country?: string }>;
  uris?: Array<{ uri: string; name?: string }>;
  rsvpCounts?: { going: number; interested: number; notgoing: number };
}

interface SegmentProgress {
  uri: string;
  rkey: string;
  segmentUri: string;
  memberDid: string;
  completed: boolean;
  completedAt: string;
}

interface RosterEntry {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  completedAt: string;
}

interface Post {
  uri: string;
  rkey: string;
  text: string;
  groupDid?: string;
  segmentUri?: string;
  listItemUri?: string;
  parentPostUri?: string;
  authorDid: string;
  author?: {
    did: string;
    handle: string;
    displayName?: string;
    avatar?: string;
  };
  mentionedDids?: string[];
  createdAt: string;
  replies: Post[];
  isLegacy?: boolean;
}

interface MediaItem {
  id: number;
  title: string;
  creator: string | null;
  coverImage: string | null;
  description: string | null;
  mediaType: string;
  length: number | null;
  publishedYear: number | null;
}

interface GroupItemDetailPageProps {
  apiUrl: string;
}

// ── Helpers ──────────────────────────────────────────────────────

const mediaTypeLabels: Record<string, string> = {
  book: 'book',
  movie: 'movie',
  tv: 'TV show',
  music: 'album',
  game: 'game',
  podcast: 'podcast',
  article: 'article',
  video: 'video',
  course: 'course',
};

const mediaTypeEmoji: Record<string, string> = {
  book: '📖',
  movie: '🎬',
  tv: '📺',
  music: '🎵',
  game: '🎮',
  podcast: '🎙️',
  article: '📰',
  video: '📹',
  course: '🎓',
};

function formatDate(dateStr: string): string {
  return safeFormatDateLong(dateStr) || 'Unknown date';
}

function dateToICSDate(d: Date): string {
  // Returns a DATE value (all-day) in YYYYMMDD format using UTC
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function escapeICSText(str: string): string {
  // RFC 5545: normalize all newline variants first, then escape backslashes,
  // semicolons, commas, and newlines
  return str
    .replace(/\r\n|\r/g, '\n')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildICS(
  segments: Segment[],
  itemTitle: string,
  groupDid: string,
  itemUri: string
): string {
  const now = new Date();
  // DTSTAMP in UTC: YYYYMMDDTHHmmssZ
  const dtstamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    'T',
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
    'Z',
  ].join('');

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Collective Social//Book Club//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const seg of segments) {
    if (!seg.assignedDate) continue;

    const startDate = new Date(seg.assignedDate);
    const endDate = new Date(seg.assignedDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const rangeLabel = segmentRangeLabel(seg);
    const summary = `${seg.label} – ${itemTitle}`;
    // Incorporate group/item context so UIDs are globally unique
    const uid = `${encodeURIComponent(groupDid)}-${encodeURIComponent(itemUri)}-${seg.rkey}@collectivesocial.app`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dateToICSDate(startDate)}`);
    lines.push(`DTEND;VALUE=DATE:${dateToICSDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICSText(summary)}`);
    if (rangeLabel) {
      lines.push(`DESCRIPTION:${escapeICSText(rangeLabel)}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function segmentRangeLabel(seg: Segment): string {
  if (seg.segmentType === 'chapters' && seg.startChapter != null) {
    if (seg.endChapter != null && seg.endChapter !== seg.startChapter) {
      return `Chapters ${seg.startChapter}–${seg.endChapter}`;
    }
    return `Chapter ${seg.startChapter}`;
  }
  if (seg.segmentType === 'pages' && seg.startPage != null) {
    if (seg.endPage != null && seg.endPage !== seg.startPage) {
      return `Pages ${seg.startPage}–${seg.endPage}`;
    }
    return `Page ${seg.startPage}`;
  }
  if (seg.startPercent != null && seg.endPercent != null) {
    if (seg.startPercent === 0 && seg.endPercent === 100) return 'Entire work';
    return `${seg.startPercent}%–${seg.endPercent}%`;
  }
  return '';
}

// ── Component ────────────────────────────────────────────────────

export function GroupItemDetailPage({ apiUrl }: GroupItemDetailPageProps) {
  const { groupDid, listRkey, itemRkey } = useParams<{
    groupDid: string;
    listRkey: string;
    itemRkey: string;
  }>();
  const navigate = useNavigate();

  // Core data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<ItemRecord | null>(null);
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, SegmentProgress[]>>({});
  const [myProgressSet, setMyProgressSet] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Record<string, CollectionPermission>>({});
  const [userDid, setUserDid] = useState<string | null>(null);

  // Discussion per segment
  const [postsBySegment, setPostsBySegment] = useState<Record<string, Post[]>>({});
  // Tracks which segments are currently fetching posts so the expanded panel
  // can show a spinner instead of flashing "No comments yet" before data
  // arrives.
  const [postsLoading, setPostsLoading] = useState<Record<string, boolean>>({});
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Segment CRUD
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [segLabel, setSegLabel] = useState('');
  const [segType, setSegType] = useState<string>('percent');
  const [segStart, setSegStart] = useState('');
  const [segEnd, setSegEnd] = useState('');
  const [segDueDate, setSegDueDate] = useState('');
  const [segIsWhole, setSegIsWhole] = useState(false);
  const [segSaving, setSegSaving] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [deleteSegmentRkey, setDeleteSegmentRkey] = useState<string | null>(null);
  const [deletingSegment, setDeletingSegment] = useState(false);

  // Segment event fields
  const [eventsBySegment, setEventsBySegment] = useState<Record<string, SegmentEvent>>({});
  const [segEventEnabled, setSegEventEnabled] = useState(false);
  const [segEventName, setSegEventName] = useState('');
  const [segEventDate, setSegEventDate] = useState('');
  const [segEventTime, setSegEventTime] = useState('');
  const [segEventMode, setSegEventMode] = useState<string>('virtual');
  const [segEventLocation, setSegEventLocation] = useState('');
  const [segEventLink, setSegEventLink] = useState('');
  const [segEventLinkName, setSegEventLinkName] = useState('');

  // Roster toggle
  const [showRoster, setShowRoster] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<Record<string, RosterEntry[]>>({});
  const [rosterLoading, setRosterLoading] = useState<string | null>(null);

  // Track in library
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(false);
  // URI of the user's `app.collectivesocial.feed.useritem` record for this
  // media item, used to PUT updates from the ItemModal. Null until we know
  // the item is in the user's library.
  const [userItemUri, setUserItemUri] = useState<string | null>(null);

  // Edit-in-library modal state
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [libraryCollections, setLibraryCollections] = useState<Collection[]>([]);
  const [libraryListUri, setLibraryListUri] = useState<string>('');
  const [libraryReviewData, setLibraryReviewData] = useState({
    status: 'in-progress',
    rating: 0,
    review: '',
    notes: '',
    recommendedBy: '',
    completedAt: '',
  });

  const segmentPerm = permissions['app.collectivesocial.group.segment'];
  const postPerm = permissions['app.collectivesocial.group.post'];

  // ── Data fetching ──────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!groupDid || !listRkey || !itemRkey) return;

    try {
      // Fetch in parallel: list data, permissions (lightweight), user info
      const [listRes, permRes, userRes] = await Promise.all([
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/lists/${encodeURIComponent(listRkey)}`,
          { credentials: 'include' }
        ),
        fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid)}/permissions`, {
          credentials: 'include',
        }),
        fetch(`${apiUrl}/users/me`, { credentials: 'include' }),
      ]);

      if (!listRes.ok) {
        throw new Error(
          listRes.status === 403
            ? 'You must be a member of this group to view this item'
            : 'Failed to load item details'
        );
      }

      const listData = await listRes.json();
      const foundItem = (listData.items || []).find((i: ItemRecord) => i.rkey === itemRkey);
      if (!foundItem) throw new Error('Item not found in this list');
      setItem(foundItem);

      if (permRes.ok) {
        const permData = await permRes.json();
        setPermissions(permData.permissions || {});
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserDid(userData.did || null);
      }

      // Fetch media item details if we have a mediaItemId
      if (foundItem.mediaItemId) {
        try {
          const mediaRes = await fetch(`${apiUrl}/media/${foundItem.mediaItemId}`, {
            credentials: 'include',
          });
          if (mediaRes.ok) {
            const mediaData = await mediaRes.json();
            setMediaItem(mediaData);
          }
        } catch {
          // Non-fatal
        }
      }

      // Fetch segments + all progress in parallel (batch endpoint)
      const [segRes, progressRes] = await Promise.all([
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/items/${encodeURIComponent(itemRkey)}/segments`,
          { credentials: 'include' }
        ),
        fetch(
          `${apiUrl}/groups/${encodeURIComponent(groupDid)}/items/${encodeURIComponent(itemRkey)}/progress`,
          { credentials: 'include' }
        ),
      ]);

      if (segRes.ok) {
        const segData = await segRes.json();
        const segs: Segment[] = segData.segments || [];
        setSegments(segs);

        // Fetch events for each segment in parallel
        const eventEntries = await Promise.all(
          segs.map(async seg => {
            try {
              const evtRes = await fetch(
                `${apiUrl}/groups/${encodeURIComponent(groupDid)}/segments/${encodeURIComponent(seg.rkey)}/event`,
                { credentials: 'include' }
              );
              if (evtRes.ok) {
                const evtData = await evtRes.json();
                return [seg.uri, evtData.event] as [string, SegmentEvent];
              }
            } catch {
              /* no event for this segment */
            }
            return null;
          })
        );
        const evtMap: Record<string, SegmentEvent> = {};
        for (const entry of eventEntries) {
          if (entry) evtMap[entry[0]] = entry[1];
        }
        setEventsBySegment(evtMap);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        const raw = progressData.progressBySegment || {};
        // API returns single records (object|null); normalize to arrays
        const normalized: Record<string, SegmentProgress[]> = {};
        for (const [segUri, prog] of Object.entries(raw)) {
          if (Array.isArray(prog)) {
            normalized[segUri] = prog;
          } else if (prog) {
            normalized[segUri] = [prog as SegmentProgress];
          } else {
            normalized[segUri] = [];
          }
        }
        setProgressMap(normalized);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, groupDid, listRkey, itemRkey]);

  // Separate effect to build myProgressSet once we have both progressMap and userDid
  useEffect(() => {
    if (!userDid) return;
    const mySet = new Set<string>();
    for (const [segUri, progs] of Object.entries(progressMap)) {
      if (progs.some(p => p.memberDid === userDid && p.completed)) {
        mySet.add(segUri);
      }
    }
    setMyProgressSet(mySet);
  }, [progressMap, userDid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Detect whether this item is already in the user's library ──
  //
  // We use mediaItemId (when present) to look up the user's
  // `app.collectivesocial.feed.useritem` record. If found, the button shifts
  // from "Track in My Library" to "Update in My Library" and we keep the URI
  // around so the edit modal can PUT updates to it directly.
  useEffect(() => {
    if (!userDid || !item?.mediaItemId) {
      setTracked(false);
      setUserItemUri(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/useritems/by-media/${item.mediaItemId}`, {
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.useritem?.uri) {
          setTracked(true);
          setUserItemUri(data.useritem.uri);
          // Seed the edit modal with the existing values so re-opening the
          // dialog reflects what's currently in the user's library.
          setLibraryReviewData({
            status: data.useritem.status || 'in-progress',
            rating: data.useritem.rating ?? 0,
            review: data.useritem.review || '',
            notes: data.useritem.notes || '',
            recommendedBy: '',
            completedAt: data.useritem.completedAt || '',
          });
        } else {
          setTracked(false);
          setUserItemUri(null);
        }
      } catch (err) {
        // Non-fatal: we'll fall back to the "Track in My Library" CTA.
        console.warn('Could not check library status:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, userDid, item?.mediaItemId]);

  // ── Segment CRUD handlers ─────────────────────────────────────

  const openAddSegment = () => {
    setSegLabel('');
    setSegType('percent');
    setSegStart('');
    setSegEnd('');
    setSegDueDate('');
    setSegIsWhole(false);
    setEditingSegment(null);
    setSegEventEnabled(false);
    setSegEventName('');
    setSegEventDate('');
    setSegEventTime('');
    setSegEventMode('virtual');
    setSegEventLocation('');
    setSegEventLink('');
    setSegEventLinkName('');
    setShowAddSegment(true);
  };

  const openEditSegment = (seg: Segment) => {
    setSegLabel(seg.label);
    setSegType(seg.segmentType || 'percent');
    if (seg.startPercent === 0 && seg.endPercent === 100) {
      setSegIsWhole(true);
      setSegStart('');
      setSegEnd('');
    } else {
      setSegIsWhole(false);
      if (seg.segmentType === 'chapters') {
        setSegStart(seg.startChapter?.toString() || '');
        setSegEnd(seg.endChapter?.toString() || '');
      } else if (seg.segmentType === 'pages') {
        setSegStart(seg.startPage?.toString() || '');
        setSegEnd(seg.endPage?.toString() || '');
      } else {
        setSegStart(seg.startPercent?.toString() || '');
        setSegEnd(seg.endPercent?.toString() || '');
      }
    }
    setSegDueDate(seg.assignedDate ? seg.assignedDate.split('T')[0] : '');
    setEditingSegment(seg);

    // Load existing event for this segment
    const existingEvent = eventsBySegment[seg.uri];
    if (existingEvent) {
      setSegEventEnabled(true);
      setSegEventName(existingEvent.name || '');
      if (existingEvent.startsAt) {
        const dt = new Date(existingEvent.startsAt);
        setSegEventDate(dt.toISOString().split('T')[0]);
        setSegEventTime(dt.toTimeString().slice(0, 5));
      } else {
        setSegEventDate('');
        setSegEventTime('');
      }
      const modeFragment = existingEvent.mode?.split('#')[1] || 'virtual';
      setSegEventMode(modeFragment);
      const loc = existingEvent.locations?.[0];
      setSegEventLocation(loc?.name || '');
      const link = existingEvent.uris?.[0];
      setSegEventLink(link?.uri || '');
      setSegEventLinkName(link?.name || '');
    } else {
      setSegEventEnabled(false);
      setSegEventName('');
      setSegEventDate('');
      setSegEventTime('');
      setSegEventMode('virtual');
      setSegEventLocation('');
      setSegEventLink('');
      setSegEventLinkName('');
    }

    setShowAddSegment(true);
  };

  const handleSaveSegment = async () => {
    if (!segLabel.trim()) return;
    setSegSaving(true);

    const body: Record<string, unknown> = { label: segLabel.trim() };

    if (segIsWhole) {
      body.segmentType = 'percent';
      body.startPercent = 0;
      body.endPercent = 100;
    } else {
      body.segmentType = segType;
      const start = parseInt(segStart);
      const end = parseInt(segEnd);
      if (segType === 'chapters') {
        if (!isNaN(start)) body.startChapter = start;
        if (!isNaN(end)) body.endChapter = end;
      } else if (segType === 'pages') {
        if (!isNaN(start)) body.startPage = start;
        if (!isNaN(end)) body.endPage = end;
      } else {
        if (!isNaN(start)) body.startPercent = start;
        if (!isNaN(end)) body.endPercent = end;
      }
    }

    if (segDueDate) {
      body.assignedDate = new Date(segDueDate + 'T23:59:59Z').toISOString();
    }

    try {
      const url = editingSegment
        ? `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(editingSegment.rkey)}`
        : `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/items/${encodeURIComponent(itemRkey!)}/segments`;
      const method = editingSegment ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save segment');

      // Save event if enabled
      const segData = await res.json();
      const savedRkey = editingSegment?.rkey || segData.segment?.rkey;
      if (segEventEnabled && savedRkey) {
        const eventBody: Record<string, unknown> = {
          name: segEventName.trim() || segLabel.trim(),
        };
        if (segEventDate) {
          const timeStr = segEventTime || '00:00';
          eventBody.startsAt = new Date(`${segEventDate}T${timeStr}:00`).toISOString();
        }
        eventBody.mode = segEventMode;
        if (segEventLocation.trim()) {
          eventBody.locations = [{ name: segEventLocation.trim() }];
        }
        if (segEventLink.trim()) {
          eventBody.uris = [
            {
              uri: segEventLink.trim(),
              name: segEventLinkName.trim() || undefined,
            },
          ];
        }

        const existingEvent = editingSegment ? eventsBySegment[editingSegment.uri] : null;
        const eventUrl = `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(savedRkey)}/event`;
        const eventMethod = existingEvent ? 'PUT' : 'POST';

        const evtRes = await fetch(eventUrl, {
          method: eventMethod,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventBody),
        });
        if (!evtRes.ok) {
          console.error('Failed to save event:', await evtRes.text());
        }
      } else if (!segEventEnabled && editingSegment && eventsBySegment[editingSegment.uri]) {
        // Event was disabled — delete it
        const deleteUrl = `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(editingSegment.rkey)}/event`;
        await fetch(deleteUrl, { method: 'DELETE', credentials: 'include' }).catch(() => {});
      }

      setShowAddSegment(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to save segment:', err);
    } finally {
      setSegSaving(false);
    }
  };

  const handleDeleteSegment = async () => {
    if (!deleteSegmentRkey) return;
    setDeletingSegment(true);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(deleteSegmentRkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to delete segment');
      setDeleteSegmentRkey(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete segment:', err);
    } finally {
      setDeletingSegment(false);
    }
  };

  // ── Progress handlers ──────────────────────────────────────────

  const handleMarkCompleted = async (segRkey: string) => {
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/progress`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.error('Mark progress failed:', res.status, errBody);
        throw new Error(errBody.error || `Failed to mark progress (${res.status})`);
      }
      await fetchData();
    } catch (err) {
      console.error('Failed to mark progress:', err);
    }
  };

  const handleUnmarkCompleted = async (segRkey: string, segUri: string) => {
    // Find our progress record
    const progs = progressMap[segUri] || [];
    const mine = progs.find(p => p.memberDid === userDid);
    if (!mine) return;

    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/progress/${encodeURIComponent(mine.rkey)}`,
        { method: 'DELETE', credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to unmark progress');
      await fetchData();
    } catch (err) {
      console.error('Failed to unmark progress:', err);
    }
  };

  const fetchRoster = async (segRkey: string) => {
    setRosterLoading(segRkey);
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/roster`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        setRosterData(prev => ({ ...prev, [segRkey]: data.roster || [] }));
      }
    } catch (err) {
      console.error('Failed to fetch roster:', err);
    } finally {
      setRosterLoading(null);
    }
  };

  const handleToggleRoster = (segRkey: string) => {
    if (showRoster === segRkey) {
      setShowRoster(null);
    } else {
      setShowRoster(segRkey);
      if (!rosterData[segRkey]) {
        fetchRoster(segRkey);
      }
    }
  };

  // ── Discussion handlers ────────────────────────────────────────

  const fetchPosts = async (segRkey: string) => {
    const seg = segments.find(s => s.rkey === segRkey);
    const segUri = seg?.uri;
    if (segUri) {
      setPostsLoading(prev => ({ ...prev, [segUri]: true }));
    }
    try {
      const res = await fetch(
        `${apiUrl}/groups/${encodeURIComponent(groupDid!)}/segments/${encodeURIComponent(segRkey)}/posts`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const data = await res.json();
        if (segUri) {
          setPostsBySegment(prev => ({ ...prev, [segUri]: data.posts || [] }));
        }
      }
    } catch {
      /* non-fatal */
    } finally {
      if (segUri) {
        setPostsLoading(prev => ({ ...prev, [segUri]: false }));
      }
    }
  };

  const handleToggleDiscussion = async (segRkey: string, segUri: string) => {
    if (expandedSegment === segUri) {
      setExpandedSegment(null);
    } else {
      setExpandedSegment(segUri);
      await fetchPosts(segRkey);
    }
  };

  const handlePostComment = async (segRkey: string, segUri: string, parentUri?: string) => {
    const text = parentUri ? replyText : postText;
    if (!text.trim()) return;
    setPostingComment(true);
    setCommentError(null);

    try {
      const body: Record<string, string> = { text: text.trim(), segmentUri: segUri };
      if (parentUri) body.parentPostUri = parentUri;

      const res = await fetch(`${apiUrl}/groups/${encodeURIComponent(groupDid!)}/posts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to post comment');

      if (parentUri) {
        setReplyText('');
        setReplyingTo(null);
      } else {
        setPostText('');
      }
      await fetchPosts(segRkey);
    } catch (err) {
      console.error('Failed to post:', err);
      setCommentError("We couldn't post your comment. Check your connection and try again.");
    } finally {
      setPostingComment(false);
    }
  };

  // ── Export to calendar ────────────────────────────────────────

  const handleExportCalendar = () => {
    const icsContent = buildICS(
      segments,
      item?.title || 'Book Club',
      groupDid || '',
      item?.uri || ''
    );
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedTitle = (item?.title || '')
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    link.download = `${sanitizedTitle || 'book-club'}-schedule.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  // ── Track / edit in library ────────────────────────────────────

  /**
   * Fetch the user's collections so the ItemModal's "change collection"
   * dropdown has options. Called when opening the modal.
   */
  const fetchLibraryCollections = useCallback(async () => {
    if (!userDid) return;
    try {
      const res = await fetch(`${apiUrl}/collections/public/${userDid}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setLibraryCollections(data.collections || []);
      }
    } catch (err) {
      console.warn('Could not load library collections:', err);
    }
  }, [apiUrl, userDid]);

  /**
   * Handler for the header CTA. If the item isn't already in the user's
   * library, quick-adds it to their Inbox as in-progress so they have a
   * record to edit, then opens the edit modal. If it's already tracked,
   * just opens the modal seeded with the current useritem values.
   */
  const handleOpenLibraryModal = async () => {
    if (!item) return;
    if (tracking) return;

    // Already tracked — just open the modal. The values were seeded by the
    // tracked-state effect when the useritem was fetched.
    if (tracked && userItemUri) {
      await fetchLibraryCollections();
      setShowLibraryModal(true);
      return;
    }

    // Not yet tracked: quick-add then open the modal so the user can edit
    // status / rating / notes immediately.
    setTracking(true);
    try {
      const res = await fetch(`${apiUrl}/collections/quick-add`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaItemId: item.mediaItemId,
          mediaType: item.mediaType,
          title: item.title,
          creator: item.creator,
          status: 'in-progress',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add to your library');
      }
      const data = await res.json();
      const newUri: string | null = data.userItemUri || null;
      setTracked(true);
      setUserItemUri(newUri);
      setLibraryReviewData({
        status: 'in-progress',
        rating: 0,
        review: '',
        notes: '',
        recommendedBy: '',
        completedAt: '',
      });
      if (data.listUri) setLibraryListUri(data.listUri);
      await fetchLibraryCollections();
      setShowLibraryModal(true);
    } catch (err: unknown) {
      console.error('Failed to add to library:', err);
      toaster.error({
        title: 'Couldn\u2019t add to your library',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setTracking(false);
    }
  };

  /**
   * Persist edits made in the library modal to the user's useritem record.
   */
  const handleLibrarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userItemUri) {
      setShowLibraryModal(false);
      return;
    }
    try {
      const res = await fetch(`${apiUrl}/useritems/${encodeURIComponent(userItemUri)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: libraryReviewData.status,
          rating: libraryReviewData.rating || null,
          review: libraryReviewData.review || null,
          notes: libraryReviewData.notes || null,
          completedAt: libraryReviewData.completedAt
            ? new Date(libraryReviewData.completedAt).toISOString()
            : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update item');
      }
      setShowLibraryModal(false);
      toaster.success({ title: 'Updated in your library' });
    } catch (err: unknown) {
      console.error('Failed to update useritem:', err);
      toaster.error({
        title: 'Couldn\u2019t save changes',
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  // ── Render helpers ─────────────────────────────────────────────

  /**
   * Determine if the user can see discussion for a segment.
   * They can if they've completed this segment OR any later-ordered segment.
   * Admins (users who can create segments) bypass the spoiler gate.
   */
  const canSeeDiscussion = (seg: Segment): boolean => {
    return checkCanSeeDiscussion(seg, segments, myProgressSet, !!segmentPerm?.canCreate);
  };

  const renderPostTree = (posts: Post[], segRkey: string, segUri: string, depth = 0) => {
    return posts.map(post => (
      <Box
        key={post.uri}
        ml={depth > 0 ? 6 : 0}
        pl={depth > 0 ? 4 : 0}
        borderLeftWidth={depth > 0 ? '2px' : '0'}
        borderColor="border.subtle"
        mb={3}
      >
        <Box bg={depth > 0 ? 'transparent' : 'bg.subtle'} p={3} borderRadius="md">
          <HStack gap={2} mb={1} alignItems="center">
            {post.author?.avatar && (
              <Image
                src={post.author.avatar}
                width="20px"
                height="20px"
                borderRadius="full"
                alt={post.author.handle}
              />
            )}
            <Text fontSize="xs" fontWeight="medium">
              {post.author?.displayName ||
                (post.author?.handle ? `@${post.author.handle}` : null) ||
                (post.authorDid ?? 'Unknown').slice(0, 20) + '…'}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              · {formatDate(post.createdAt)}
            </Text>
          </HStack>
          <Text fontSize="sm" whiteSpace="pre-wrap">
            {post.text}
          </Text>
          {postPerm?.canCreate && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="blue"
              mt={1}
              onClick={() => {
                setReplyingTo(replyingTo === post.uri ? null : post.uri);
                setReplyText('');
              }}
            >
              Reply
            </Button>
          )}
        </Box>

        {replyingTo === post.uri && (
          <Box ml={6} mt={2}>
            <VStack gap={2} align="stretch">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                size="sm"
                rows={2}
              />
              <HStack gap={1} justifyContent="flex-end">
                <Button size="xs" variant="ghost" onClick={() => setReplyingTo(null)}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  colorPalette="accent"
                  onClick={() => handlePostComment(segRkey, segUri, post.uri)}
                  disabled={!replyText.trim() || postingComment}
                >
                  {postingComment ? '...' : 'Send'}
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {post.replies?.length > 0 && renderPostTree(post.replies, segRkey, segUri, depth + 1)}
      </Box>
    ));
  };

  // ── Loading / Error states ─────────────────────────────────────

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <Center py={20}>
          <VStack gap={4}>
            <Spinner size="xl" color="accent.solid" />
            <Text color="fg.muted">Loading item...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  if (error || !item) {
    return (
      <Container maxW="4xl" py={8}>
        <EmptyState
          icon="😕"
          title={error || 'Item not found'}
          description="This item may not exist or you may need to join the group first."
        />
        <Center mt={6}>
          <Button
            variant="outline"
            onClick={() => navigate(`/groups/${encodeURIComponent(groupDid!)}`)}
          >
            ← Back to Group
          </Button>
        </Center>
      </Container>
    );
  }

  const totalSegments = segments.length;
  const completedSegments = segments.filter(s => myProgressSet.has(s.uri)).length;

  return (
    <Container maxW="4xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Back nav */}
        <Button
          variant="ghost"
          size="sm"
          alignSelf="flex-start"
          onClick={() =>
            navigate(
              `/groups/${encodeURIComponent(groupDid!)}/lists/${encodeURIComponent(listRkey!)}`
            )
          }
          color="fg.muted"
          _hover={{ color: 'fg.default' }}
        >
          ← Back to List
        </Button>

        {/* ── Item Header ──────────────────────────────────────── */}
        <Box bg="bg.card" borderRadius="xl" borderWidth="1px" borderColor="border.card" p={6}>
          <Flex gap={6} direction={{ base: 'column', sm: 'row' }}>
            {/* Cover image */}
            {mediaItem?.coverImage && (
              <Image
                src={mediaItem.coverImage}
                alt={item.title}
                w="120px"
                h="180px"
                objectFit="cover"
                borderRadius="lg"
                flexShrink={0}
              />
            )}

            <Box flex={1}>
              <HStack gap={2} mb={1}>
                <Text fontSize="2xl">{mediaTypeEmoji[item.mediaType] || '📄'}</Text>
                <Heading size="xl" fontFamily="heading">
                  {item.title}
                </Heading>
              </HStack>

              {(item.creator || mediaItem?.creator) && (
                <Text fontSize="md" color="fg.muted" mb={2}>
                  by {item.creator || mediaItem?.creator}
                </Text>
              )}

              {mediaItem?.description && (
                <Text fontSize="sm" color="fg.muted" mb={3} lineClamp={3}>
                  {mediaItem.description}
                </Text>
              )}

              <HStack gap={3} flexWrap="wrap" mb={4}>
                <Badge colorPalette="blue" size="sm">
                  {item.status}
                </Badge>
                {mediaItem?.publishedYear && (
                  <Text fontSize="xs" color="fg.subtle">
                    {mediaItem.publishedYear}
                  </Text>
                )}
                {mediaItem?.length && (
                  <Text fontSize="xs" color="fg.subtle">
                    {item.mediaType === 'book'
                      ? `${mediaItem.length} pages`
                      : `${mediaItem.length} min`}
                  </Text>
                )}
              </HStack>

              {/* Action buttons */}
              <HStack gap={2} flexWrap="wrap">
                {userDid && (
                  <Button
                    size="sm"
                    colorPalette="accent"
                    variant={tracked ? 'solid' : 'outline'}
                    onClick={handleOpenLibraryModal}
                    disabled={tracking}
                  >
                    {tracking
                      ? 'Adding...'
                      : tracked
                        ? '📚 Update in My Library'
                        : '📚 Track in My Library'}
                  </Button>
                )}
                {item.mediaItemId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/items/${item.mediaItemId}`)}
                    color="fg.muted"
                  >
                    View Details →
                  </Button>
                )}
              </HStack>
            </Box>
          </Flex>
        </Box>

        {/* ── Personal Progress Summary ────────────────────────── */}
        {totalSegments > 0 && (
          <Box bg="bg.card" borderRadius="lg" borderWidth="1px" borderColor="border.card" p={4}>
            <Flex justify="space-between" align="center" mb={2}>
              <Text fontSize="sm" fontWeight="bold">
                Your Progress
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {completedSegments} / {totalSegments} segments completed
              </Text>
            </Flex>
            <Box bg="bg.subtle" borderRadius="full" h="8px" overflow="hidden">
              <Box
                bg="green.solid"
                h="100%"
                w={`${totalSegments > 0 ? (completedSegments / totalSegments) * 100 : 0}%`}
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
          </Box>
        )}

        {/* ── Segments Timeline ────────────────────────────────── */}
        <Box>
          <Flex justify="space-between" align="center" mb={4} gap={2}>
            <Heading size="md" fontFamily="heading">
              📅 Reading Schedule
            </Heading>
            {/* Header actions are collapsed into a single 3-dot menu so they
                don't crowd the heading on narrow viewports. */}
            {(segments.some(s => s.assignedDate) || segmentPerm?.canCreate) && (
              <Menu.Root positioning={{ placement: 'bottom-end' }}>
                <Menu.Trigger asChild>
                  <IconButton variant="ghost" size="sm" aria-label="Reading schedule actions">
                    ⋮
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content>
                    {segmentPerm?.canCreate && (
                      <Menu.Item value="add" onClick={openAddSegment}>
                        ➕ Add assignment
                      </Menu.Item>
                    )}
                    {segments.some(s => s.assignedDate) && (
                      <Menu.Item value="export" onClick={handleExportCalendar}>
                        📆 Export to calendar
                      </Menu.Item>
                    )}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            )}
          </Flex>

          {segments.length > 0 ? (
            <VStack gap={4} align="stretch">
              {segments.map(seg => {
                const progs = progressMap[seg.uri] || [];
                const completedCount = progs.filter(p => p.completed).length;
                const iCompleted = myProgressSet.has(seg.uri);
                const isDue = seg.assignedDate && new Date(seg.assignedDate) < new Date();
                const canSee = canSeeDiscussion(seg);
                const posts = postsBySegment[seg.uri] || [];

                const hasMenuActions =
                  (userDid && iCompleted) || segmentPerm?.canUpdate || segmentPerm?.canDelete;

                return (
                  <Box
                    key={seg.rkey}
                    bg="bg.card"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={
                      iCompleted ? 'green.muted' : isDue ? 'orange.muted' : 'border.card'
                    }
                    overflow="hidden"
                  >
                    {/* Segment header */}
                    <Box p={4}>
                      <Flex justify="space-between" align="start" gap={2}>
                        <Box flex={1} minW={0}>
                          <HStack gap={2} mb={1} flexWrap="wrap">
                            <Text fontSize="lg" fontWeight="bold">
                              {seg.label}
                            </Text>
                            {iCompleted && (
                              <Badge colorPalette="green" size="sm">
                                ✓ Completed
                              </Badge>
                            )}
                            {!iCompleted && isDue && (
                              <Badge colorPalette="orange" size="sm">
                                Overdue
                              </Badge>
                            )}
                          </HStack>

                          <HStack gap={3} fontSize="sm" color="fg.muted" flexWrap="wrap">
                            {segmentRangeLabel(seg) && <Text>{segmentRangeLabel(seg)}</Text>}
                            {seg.assignedDate && <Text>Due {formatDate(seg.assignedDate)}</Text>}
                            {/* Member completion summary. When the user can
                                read progress this whole line acts as a
                                disclosure toggle for the roster below. */}
                            {segmentPerm?.canRead ? (
                              <chakra.button
                                type="button"
                                onClick={() => handleToggleRoster(seg.rkey)}
                                aria-expanded={showRoster === seg.rkey}
                                aria-controls={`roster-${seg.rkey}`}
                                display="inline-flex"
                                alignItems="center"
                                gap={1}
                                color="fg.muted"
                                _hover={{ color: 'fg.default' }}
                                background="transparent"
                                borderWidth="0"
                                cursor="pointer"
                                fontSize="sm"
                              >
                                <Text as="span">
                                  {completedCount} member{completedCount !== 1 ? 's' : ''} completed
                                </Text>
                                <Text as="span" fontSize="xs">
                                  {showRoster === seg.rkey ? '▲' : '▼'}
                                </Text>
                              </chakra.button>
                            ) : (
                              <Text>
                                {completedCount} member{completedCount !== 1 ? 's' : ''} completed
                              </Text>
                            )}
                          </HStack>
                        </Box>

                        <HStack gap={1} flexShrink={0}>
                          {/* Mark Done stays prominent */}
                          {userDid && !iCompleted && (
                            <Button
                              size="sm"
                              colorPalette="green"
                              variant="outline"
                              onClick={() => handleMarkCompleted(seg.rkey)}
                            >
                              ✓ Mark Done
                            </Button>
                          )}

                          {/* Three-dots menu for secondary actions */}
                          {hasMenuActions && (
                            <Menu.Root positioning={{ placement: 'bottom-end' }}>
                              <Menu.Trigger asChild>
                                <IconButton variant="ghost" size="sm" aria-label="Segment actions">
                                  ⋮
                                </IconButton>
                              </Menu.Trigger>
                              <Menu.Positioner>
                                <Menu.Content>
                                  {segmentPerm?.canUpdate && (
                                    <Menu.Item value="edit" onClick={() => openEditSegment(seg)}>
                                      ✏️ Edit
                                    </Menu.Item>
                                  )}
                                  {userDid && iCompleted && (
                                    <Menu.Item
                                      value="undo"
                                      onClick={() => handleUnmarkCompleted(seg.rkey, seg.uri)}
                                    >
                                      ↩️ Undo Completion
                                    </Menu.Item>
                                  )}
                                  {segmentPerm?.canDelete && (
                                    <Menu.Item
                                      value="delete"
                                      color="fg.error"
                                      onClick={() => setDeleteSegmentRkey(seg.rkey)}
                                    >
                                      🗑️ Delete
                                    </Menu.Item>
                                  )}
                                </Menu.Content>
                              </Menu.Positioner>
                            </Menu.Root>
                          )}
                        </HStack>
                      </Flex>

                      {/* Member progress roster — expands onto its own row so
                          it doesn't share width with the action buttons. */}
                      {segmentPerm?.canRead && showRoster === seg.rkey && (
                        <Box
                          id={`roster-${seg.rkey}`}
                          mt={3}
                          p={3}
                          bg="bg.subtle"
                          borderRadius="md"
                        >
                          {rosterLoading === seg.rkey ? (
                            <Center py={2}>
                              <Spinner size="sm" />
                            </Center>
                          ) : (rosterData[seg.rkey] || []).length > 0 ? (
                            <VStack gap={2} align="stretch">
                              {(rosterData[seg.rkey] || []).map(entry => (
                                <HStack key={entry.did} gap={2}>
                                  {entry.avatar ? (
                                    <Image
                                      src={entry.avatar}
                                      width="24px"
                                      height="24px"
                                      borderRadius="full"
                                      alt={entry.handle}
                                    />
                                  ) : (
                                    <Box w="24px" h="24px" borderRadius="full" bg="bg.emphasized" />
                                  )}
                                  <Text fontSize="xs" fontWeight="medium" flex={1}>
                                    {entry.displayName || `@${entry.handle}`}
                                  </Text>
                                  <Text fontSize="xs" color="fg.subtle">
                                    {formatDate(entry.completedAt)}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          ) : (
                            <Text fontSize="xs" color="fg.muted" textAlign="center">
                              No completions yet
                            </Text>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Event / meeting info — inset as a card-in-card so it
                        doesn't span the full segment width, which looked awkward
                        on desktop. */}
                    {eventsBySegment[seg.uri] &&
                      (() => {
                        const evt = eventsBySegment[seg.uri];
                        const modeLabel = evt.mode?.split('#')[1];
                        const modeEmoji =
                          modeLabel === 'virtual'
                            ? '💻'
                            : modeLabel === 'inperson'
                              ? '📍'
                              : modeLabel === 'hybrid'
                                ? '🔀'
                                : '📅';
                        const loc = evt.locations?.[0];
                        const link = evt.uris?.[0];
                        return (
                          <Box px={4} pb={4}>
                            <Box
                              p={3}
                              bg="bg.subtle"
                              borderWidth="1px"
                              borderColor="border.subtle"
                              borderRadius="md"
                            >
                              <HStack gap={2} mb={1} flexWrap="wrap">
                                <Text fontSize="sm" fontWeight="medium">
                                  {modeEmoji} {evt.name}
                                </Text>
                                {evt.rsvpCounts && evt.rsvpCounts.going > 0 && (
                                  <Badge colorPalette="green" size="sm">
                                    {evt.rsvpCounts.going} going
                                  </Badge>
                                )}
                              </HStack>
                              <HStack gap={3} fontSize="sm" color="fg.muted" flexWrap="wrap">
                                {evt.startsAt && (
                                  <Text>
                                    {new Date(evt.startsAt).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                    {' at '}
                                    {new Date(evt.startsAt).toLocaleTimeString(undefined, {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                    })}
                                  </Text>
                                )}
                                {loc?.name && <Text>📍 {loc.name}</Text>}
                                {link && (
                                  <chakra.a
                                    href={link.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    color="accent.fg"
                                    textDecoration="underline"
                                  >
                                    🔗 {link.name || 'Join Meeting'}
                                  </chakra.a>
                                )}
                              </HStack>
                            </Box>
                          </Box>
                        );
                      })()}

                    {/* Discussion section */}
                    <Box borderTopWidth="1px" borderColor="border.subtle">
                      <Button
                        variant="ghost"
                        w="full"
                        borderRadius="0"
                        size="sm"
                        onClick={() => handleToggleDiscussion(seg.rkey, seg.uri)}
                        color="fg.muted"
                        aria-expanded={expandedSegment === seg.uri}
                      >
                        💬 Discussion {expandedSegment === seg.uri ? '▲' : '▼'}
                      </Button>

                      {expandedSegment === seg.uri && (
                        <Box p={4} pt={2}>
                          {canSee ? (
                            <VStack gap={3} align="stretch">
                              {postsLoading[seg.uri] && !postsBySegment[seg.uri] ? (
                                /* First-fetch in flight: show a spinner so we
                                   don't briefly flash "No comments yet" before
                                   the real posts arrive. */
                                <Center py={6}>
                                  <Spinner size="sm" />
                                </Center>
                              ) : posts.length > 0 ? (
                                renderPostTree(posts, seg.rkey, seg.uri)
                              ) : (
                                <Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
                                  No comments yet. Be the first to share your thoughts!
                                </Text>
                              )}

                              {/* New comment form */}
                              {postPerm?.canCreate ? (
                                <Box
                                  mt={2}
                                  p={3}
                                  borderWidth="1px"
                                  borderColor="border.card"
                                  borderRadius="md"
                                  bg="bg.subtle"
                                >
                                  <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={2}>
                                    Add a comment
                                  </Text>
                                  <Textarea
                                    value={postText}
                                    onChange={e => setPostText(e.target.value)}
                                    placeholder="Share your thoughts on this section..."
                                    aria-label="Comment on this segment"
                                    size="sm"
                                    rows={2}
                                    bg="bg"
                                    borderColor="border.card"
                                  />
                                  {commentError && (
                                    <Text color="fg.error" fontSize="sm" mt={1}>
                                      {commentError}
                                    </Text>
                                  )}
                                  <Flex justify="flex-end" mt={2}>
                                    <Button
                                      size="sm"
                                      colorPalette="accent"
                                      onClick={() => handlePostComment(seg.rkey, seg.uri)}
                                      disabled={!postText.trim() || postingComment}
                                    >
                                      {postingComment ? '...' : 'Post'}
                                    </Button>
                                  </Flex>
                                </Box>
                              ) : (
                                <Text fontSize="sm" color="fg.muted" fontStyle="italic">
                                  You need to be a group member to comment on this discussion.
                                </Text>
                              )}
                            </VStack>
                          ) : (
                            <Box textAlign="center" py={6}>
                              <Text fontSize="2xl" mb={2}>
                                🔒
                              </Text>
                              <Text fontSize="sm" color="fg.muted">
                                Complete this segment to see the discussion and avoid spoilers.
                              </Text>
                              <Button
                                size="sm"
                                colorPalette="green"
                                variant="outline"
                                mt={3}
                                onClick={() => handleMarkCompleted(seg.rkey)}
                              >
                                ✓ I've finished this section
                              </Button>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </VStack>
          ) : (
            <EmptyState
              icon="📅"
              title="No assignments yet"
              description={
                segmentPerm?.canCreate
                  ? `Add reading or watching assignments so the group knows what to ${mediaTypeLabels[item.mediaType] || 'complete'} by when.`
                  : "The group admin hasn't set any assignments yet."
              }
            />
          )}
        </Box>
      </VStack>

      {/* ── Add/Edit Segment Dialog ──────────────────────────── */}
      <DialogRoot open={showAddSegment} onOpenChange={e => setShowAddSegment(e.open)}>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSegment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color="fg.muted">
                  What portion of this {mediaTypeLabels[item.mediaType] || 'item'} should be
                  completed, and by when?
                </Text>

                <Field label="Label">
                  <Input
                    value={segLabel}
                    onChange={e => setSegLabel(e.target.value)}
                    placeholder={`e.g. "Chapters 1-5" or "Episode 1"`}
                    autoFocus
                  />
                </Field>

                {/* Whole item toggle */}
                <HStack gap={2}>
                  <Button
                    size="sm"
                    variant={segIsWhole ? 'solid' : 'outline'}
                    colorPalette={segIsWhole ? 'accent' : 'gray'}
                    onClick={() => setSegIsWhole(!segIsWhole)}
                  >
                    {segIsWhole ? '✓ ' : ''}The entire {mediaTypeLabels[item.mediaType] || 'item'}
                  </Button>
                </HStack>

                {!segIsWhole && (
                  <>
                    <Field label="Segment Type">
                      <chakra.select
                        value={segType}
                        onChange={e => {
                          setSegType(e.target.value);
                          setSegStart('');
                          setSegEnd('');
                        }}
                        w="100%"
                        p="0.5rem 0.75rem"
                        bg="bg.subtle"
                        borderWidth="1px"
                        borderColor="border.card"
                        borderRadius="md"
                        fontSize="sm"
                        color="fg.default"
                      >
                        <option value="chapters">Chapters</option>
                        <option value="pages">Pages</option>
                        <option value="percent">Percent</option>
                      </chakra.select>
                    </Field>

                    <HStack gap={4}>
                      <Field label="From">
                        <Input
                          type="number"
                          value={segStart}
                          onChange={e => setSegStart(e.target.value)}
                          placeholder={segType === 'percent' ? '0' : '1'}
                          min={segType === 'percent' ? 0 : 1}
                          max={segType === 'percent' ? 100 : undefined}
                        />
                      </Field>
                      <Field label="To">
                        <Input
                          type="number"
                          value={segEnd}
                          onChange={e => setSegEnd(e.target.value)}
                          placeholder={segType === 'percent' ? '100' : ''}
                          min={segType === 'percent' ? 0 : 1}
                          max={segType === 'percent' ? 100 : undefined}
                        />
                      </Field>
                    </HStack>
                  </>
                )}

                <Field label="Due Date">
                  <Input
                    type="date"
                    value={segDueDate}
                    onChange={e => setSegDueDate(e.target.value)}
                  />
                </Field>

                {/* ── Meeting / Event ─────────────────────── */}
                {segmentPerm?.canCreate && (
                  <>
                    <HStack gap={2} mt={2}>
                      <Button
                        size="sm"
                        variant={segEventEnabled ? 'solid' : 'outline'}
                        colorPalette={segEventEnabled ? 'accent' : 'gray'}
                        onClick={() => setSegEventEnabled(!segEventEnabled)}
                      >
                        {segEventEnabled ? '✓ ' : '+ '}Meeting
                      </Button>
                      <Text fontSize="xs" color="fg.muted">
                        Schedule a meeting for this assignment
                      </Text>
                    </HStack>

                    {segEventEnabled && (
                      <VStack gap={3} align="stretch" p={3} bg="bg.subtle" borderRadius="md">
                        <Field label="Meeting Name">
                          <Input
                            value={segEventName}
                            onChange={e => setSegEventName(e.target.value)}
                            placeholder={
                              segLabel ? `${segLabel} Discussion` : 'e.g. "Book Club Meeting"'
                            }
                          />
                        </Field>

                        <HStack gap={4}>
                          <Field label="Date">
                            <Input
                              type="date"
                              value={segEventDate}
                              onChange={e => setSegEventDate(e.target.value)}
                            />
                          </Field>
                          <Field label="Time">
                            <Input
                              type="time"
                              value={segEventTime}
                              onChange={e => setSegEventTime(e.target.value)}
                            />
                          </Field>
                        </HStack>

                        <Field label="Meeting Type">
                          <chakra.select
                            value={segEventMode}
                            onChange={e => setSegEventMode(e.target.value)}
                            w="100%"
                            p="0.5rem 0.75rem"
                            bg="bg"
                            borderWidth="1px"
                            borderColor="border.card"
                            borderRadius="md"
                            fontSize="sm"
                            color="fg.default"
                          >
                            <option value="virtual">Virtual</option>
                            <option value="inperson">In Person</option>
                            <option value="hybrid">Hybrid</option>
                          </chakra.select>
                        </Field>

                        {(segEventMode === 'virtual' || segEventMode === 'hybrid') && (
                          <HStack gap={4}>
                            <Box flex={1}>
                              <Field label="Meeting Link">
                                <Input
                                  value={segEventLink}
                                  onChange={e => setSegEventLink(e.target.value)}
                                  placeholder="https://zoom.us/j/..."
                                />
                              </Field>
                            </Box>
                            <Field label="Link Label">
                              <Input
                                value={segEventLinkName}
                                onChange={e => setSegEventLinkName(e.target.value)}
                                placeholder="Zoom"
                              />
                            </Field>
                          </HStack>
                        )}

                        {(segEventMode === 'inperson' || segEventMode === 'hybrid') && (
                          <Field label="Location">
                            <Input
                              value={segEventLocation}
                              onChange={e => setSegEventLocation(e.target.value)}
                              placeholder="e.g. Downtown Library"
                            />
                          </Field>
                        )}
                      </VStack>
                    )}
                  </>
                )}
              </VStack>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button variant="outline" bg="transparent" onClick={() => setShowAddSegment(false)}>
                  Cancel
                </Button>
                <Button
                  colorPalette="accent"
                  onClick={handleSaveSegment}
                  disabled={!segLabel.trim() || segSaving}
                >
                  {segSaving ? 'Saving...' : editingSegment ? 'Save Changes' : 'Add Assignment'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* ── Delete Segment Confirmation ──────────────────────── */}
      <DialogRoot
        open={!!deleteSegmentRkey}
        onOpenChange={e => {
          if (!e.open) setDeleteSegmentRkey(null);
        }}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Assignment</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Text>
                Are you sure you want to delete this assignment? All discussion and progress records
                for it will also be removed. This cannot be undone.
              </Text>
            </DialogBody>
            <DialogFooter>
              <HStack gap={2}>
                <Button
                  variant="outline"
                  bg="transparent"
                  onClick={() => setDeleteSegmentRkey(null)}
                >
                  Cancel
                </Button>
                <Button colorPalette="red" onClick={handleDeleteSegment} disabled={deletingSegment}>
                  {deletingSegment ? 'Deleting...' : 'Delete Assignment'}
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* Library edit modal — reuses the same ItemModal as the user's
          collection pages so the editing experience is consistent. */}
      <ItemModal
        isOpen={showLibraryModal}
        onClose={() => setShowLibraryModal(false)}
        onSubmit={handleLibrarySubmit}
        apiUrl={apiUrl}
        mode="edit"
        selectedMedia={null}
        onMediaSelect={() => {}}
        reviewData={libraryReviewData}
        onReviewDataChange={setLibraryReviewData}
        itemTitle={item?.title}
        itemCreator={item?.creator || mediaItem?.creator || undefined}
        itemCoverImage={mediaItem?.coverImage || undefined}
        collections={libraryCollections}
        currentListUri={libraryListUri}
        onListChange={setLibraryListUri}
        onCollectionsRefresh={fetchLibraryCollections}
        listItemUri={userItemUri || undefined}
        mediaItemId={item?.mediaItemId ?? null}
        mediaItemLength={mediaItem?.length ?? null}
        mediaType={item?.mediaType}
      />
    </Container>
  );
}
