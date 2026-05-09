/**
 * Tests for GroupItemDetailPage.
 *
 * Covers:
 * 1. "You need to be a group member to comment" renders when postPerm.canCreate=false
 * 2. Comment textarea renders when postPerm.canCreate=true
 * 3. Comment error text appears when handlePostComment fetch fails
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from '../components/ui/provider';
import { GroupItemDetailPage } from '../pages/GroupItemDetailPage';

// ── Constants ─────────────────────────────────────────────────────

const API_URL = 'http://test.api';
const GROUP_DID = 'did:plc:community1';
const LIST_RKEY = 'list1';
const ITEM_RKEY = 'item1';
const SEGMENT_RKEY = 'seg1';
const SEGMENT_URI = `at://${GROUP_DID}/app.collectivesocial.group.segment/${SEGMENT_RKEY}`;
const USER_DID = 'did:plc:user1';

// ── Fixtures ──────────────────────────────────────────────────────

const mockItem = {
  uri: `at://${GROUP_DID}/app.collectivesocial.group.listitem/${ITEM_RKEY}`,
  rkey: ITEM_RKEY,
  title: 'The Hobbit',
  creator: 'J.R.R. Tolkien',
  mediaType: 'book',
  order: 1,
  addedBy: USER_DID,
  status: 'in-progress',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockSegment = {
  uri: SEGMENT_URI,
  rkey: SEGMENT_RKEY,
  label: 'Chapters 1-5',
  segmentType: 'chapters',
  startChapter: 1,
  endChapter: 5,
  assignedDate: null,
  order: 1,
  listItemUri: `at://${GROUP_DID}/app.collectivesocial.group.listitem/${ITEM_RKEY}`,
};

// Progress map: user has completed this segment ("finished segment" scenario)
const mockProgressMap = {
  [SEGMENT_URI]: [
    {
      uri: `at://${GROUP_DID}/app.collectivesocial.group.segment.progress/prog1`,
      rkey: 'prog1',
      memberDid: USER_DID,
      segmentUri: SEGMENT_URI,
      completed: true,
      completedAt: '2026-05-01T00:00:00.000Z',
      createdAt: '2026-05-01T00:00:00.000Z',
    },
  ],
};

// Permissions where the user CANNOT create posts (non-member scenario)
const permissionsNonMember = {
  // segmentPerm.canCreate=true so canSeeDiscussion returns true (admin flag)
  'app.collectivesocial.group.segment': {
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
  'app.collectivesocial.group.post': {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
};

// Permissions where the user CAN create posts
const permissionsMember = {
  'app.collectivesocial.group.segment': {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
  'app.collectivesocial.group.post': {
    canCreate: true,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
};

// ── Helpers ───────────────────────────────────────────────────────

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

function buildFetchMock(
  perms: Record<string, unknown>,
  postsResponse?: { ok: boolean; body: unknown }
): (url: string | URL | Request, init?: RequestInit) => Promise<Response> {
  return async (url, init) => {
    const urlStr = url.toString();
    const method = init?.method?.toUpperCase() ?? 'GET';

    if (urlStr.includes(`/lists/${LIST_RKEY}`) && method === 'GET') {
      return makeFetchResponse({ items: [mockItem] });
    }
    if (urlStr.includes('/permissions') && method === 'GET') {
      return makeFetchResponse({ permissions: perms });
    }
    if (urlStr.includes('/users/me') && method === 'GET') {
      return makeFetchResponse({ did: USER_DID });
    }
    if (urlStr.includes(`/items/${ITEM_RKEY}/segments`) && method === 'GET') {
      return makeFetchResponse({ segments: [mockSegment] });
    }
    if (urlStr.includes(`/items/${ITEM_RKEY}/progress`) && method === 'GET') {
      return makeFetchResponse({ progressBySegment: mockProgressMap });
    }
    if (urlStr.includes('/segments/') && urlStr.includes('/posts') && method === 'GET') {
      if (postsResponse) {
        return makeFetchResponse(postsResponse.body, postsResponse.ok);
      }
      return makeFetchResponse({ posts: [] });
    }
    if (urlStr.includes('/posts') && method === 'POST') {
      // Handled by postsResponse for POST, caller may override
      if (postsResponse && !postsResponse.ok) {
        return makeFetchResponse(postsResponse.body, false, 500);
      }
      return makeFetchResponse({ success: true });
    }
    return makeFetchResponse({});
  };
}

function renderPage() {
  return render(
    <Provider>
      <MemoryRouter initialEntries={[`/groups/${GROUP_DID}/lists/${LIST_RKEY}/items/${ITEM_RKEY}`]}>
        <Routes>
          <Route
            path="/groups/:groupDid/lists/:listRkey/items/:itemRkey"
            element={<GroupItemDetailPage apiUrl={API_URL} />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe('GroupItemDetailPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('shows "must be a group member to comment" when postPerm.canCreate is false', async () => {
    // segmentPerm.canCreate=true makes canSeeDiscussion=true (isAdmin path),
    // so the discussion area opens even though postPerm.canCreate=false.
    fetchSpy.mockImplementation(buildFetchMock(permissionsNonMember));

    renderPage();

    // Wait for the page to load and the segment to appear
    const discussionButton = await screen.findByText(/💬 Discussion/);
    await userEvent.click(discussionButton);

    await waitFor(() => {
      expect(screen.getByText(/you need to be a group member to comment/i)).toBeInTheDocument();
    });
  });

  it('renders the comment textarea when postPerm.canCreate is true', async () => {
    // With postPerm.canCreate=true and the user having completed the segment,
    // canSee=true (via myProgressSet) and the comment form is shown.
    const permsMember = {
      ...permissionsMember,
    };
    fetchSpy.mockImplementation(buildFetchMock(permsMember));

    renderPage();

    const discussionButton = await screen.findByText(/💬 Discussion/);
    await userEvent.click(discussionButton);

    await waitFor(() => {
      // The textarea for posting a comment must be present
      expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
    });
  });

  it('does NOT show the member message when app.collectivesocial.group.post is missing from permissions (regression: undefined treated as false)', async () => {
    // This is the regression scenario: the backend returned permissions WITHOUT
    // app.collectivesocial.group.post (e.g. partial DB rows that skipped DEFAULTS).
    // postPerm is undefined. The old code `{postPerm?.canCreate ? form : message}`
    // treated undefined as false and showed the denial message to members.
    // The fix: `{postPerm?.canCreate !== false ? form : message}` only shows the
    // message when canCreate is explicitly false.
    const permsWithoutGroupPost = {
      'app.collectivesocial.group.segment': {
        canCreate: true, // isAdmin path → canSeeDiscussion=true
        canRead: true,
        canUpdate: false,
        canDelete: false,
      },
      // Note: app.collectivesocial.group.post is intentionally absent
    };
    fetchSpy.mockImplementation(buildFetchMock(permsWithoutGroupPost));

    renderPage();

    const discussionButton = await screen.findByText(/💬 Discussion/);
    await userEvent.click(discussionButton);

    await waitFor(() => {
      // The denial message must NOT appear when permissions haven't loaded yet
      // or when the key is simply missing. The comment form should be shown.
      expect(screen.queryByText(/you need to be a group member to comment/i)).not.toBeInTheDocument();
    });

    // The textarea must be visible when postPerm is undefined
    expect(screen.getByPlaceholderText(/share your thoughts/i)).toBeInTheDocument();
  });

  it('shows comment error text when handlePostComment fetch fails', async () => {
    let postAttempted = false;
    fetchSpy.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (urlStr.includes(`/lists/${LIST_RKEY}`) && method === 'GET') {
        return makeFetchResponse({ items: [mockItem] });
      }
      if (urlStr.includes('/permissions') && method === 'GET') {
        return makeFetchResponse({ permissions: permissionsMember });
      }
      if (urlStr.includes('/users/me') && method === 'GET') {
        return makeFetchResponse({ did: USER_DID });
      }
      if (urlStr.includes(`/items/${ITEM_RKEY}/segments`) && method === 'GET') {
        return makeFetchResponse({ segments: [mockSegment] });
      }
      if (urlStr.includes(`/items/${ITEM_RKEY}/progress`) && method === 'GET') {
        return makeFetchResponse({ progressBySegment: mockProgressMap });
      }
      if (urlStr.includes('/segments/') && urlStr.includes('/posts') && method === 'GET') {
        return makeFetchResponse({ posts: [] });
      }
      if (urlStr.includes('/posts') && method === 'POST') {
        postAttempted = true;
        return makeFetchResponse({ error: 'Server error' }, false, 500);
      }
      return makeFetchResponse({});
    });

    renderPage();

    // Open discussion
    const discussionButton = await screen.findByText(/💬 Discussion/);
    await userEvent.click(discussionButton);

    // Wait for the comment textarea to appear
    const textarea = await screen.findByPlaceholderText(/share your thoughts/i);
    await userEvent.type(textarea, 'Great chapter!');

    // Submit the comment
    const postButton = await screen.findByRole('button', { name: /post/i });
    await userEvent.click(postButton);

    await waitFor(() => {
      expect(postAttempted).toBe(true);
      expect(screen.getByText(/couldn't post your comment/i)).toBeInTheDocument();
    });
  });
});
