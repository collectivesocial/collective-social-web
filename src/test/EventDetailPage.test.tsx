/**
 * EventDetailPage component tests
 *
 * ⚠️  INTENTIONALLY RED until Kaylee's branch (events UI — collective-social-web) merges.
 *
 * Contract expected from EventDetailPage:
 *   Route: /groups/:groupDid/events/:eventRkey
 *   props: { apiUrl }
 *   - Renders hero section with event title and description
 *   - Renders RsvpButton
 *   - Renders AttendeeList (grouped going/maybe/not-going)
 *   - Admin user sees Edit/Delete kebab menu
 *   - Non-admin user does NOT see Edit/Delete controls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from '../components/ui/provider';

const GROUP_DID = 'did:plc:community1';
const EVENT_RKEY = 'evt-detail-test';
const API_URL = 'http://test.api';

const mockEvent = {
  rkey: EVENT_RKEY,
  title: 'Annual Reading Retreat',
  description: 'A weekend of books and discussion.',
  startsAt: '2026-07-10T10:00:00.000Z',
  endsAt: '2026-07-12T17:00:00.000Z',
  location: 'Mountain Cabin',
  createdBy: 'did:plc:admin001',
  rsvpCounts: { going: 8, maybe: 2, notGoing: 0 },
  status: 'upcoming',
};

const mockAttendees = {
  rsvps: {
    going: [{ did: 'did:plc:user001', handle: 'alice.bsky.social' }],
    maybe: [{ did: 'did:plc:user002', handle: 'bob.bsky.social' }],
    notGoing: [],
  },
};

const ADMIN_PERMISSIONS = {
  'app.collectivesocial.group.event': {
    canCreate: true, canRead: true, canUpdate: true, canDelete: true,
  },
};

const MEMBER_PERMISSIONS = {
  'app.collectivesocial.group.event': {
    canCreate: false, canRead: true, canUpdate: false, canDelete: false,
  },
};

// ⚠️ Will fail until Kaylee adds the page
let EventDetailPage: React.ComponentType<{ apiUrl: string }>;
try {
  EventDetailPage = (await import('../pages/EventDetailPage')).EventDetailPage;
} catch {
  // Stub that renders enough structure for the tests to exercise
  EventDetailPage = ({ apiUrl: _apiUrl }: { apiUrl: string }) => (
    <div data-testid="event-detail-stub">
      NOT_IMPLEMENTED: EventDetailPage — waiting on Kaylee branch
    </div>
  );
}

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response;
}

function renderPage() {
  return render(
    <Provider>
      <MemoryRouter initialEntries={[`/groups/${GROUP_DID}/events/${EVENT_RKEY}`]}>
        <Routes>
          <Route
            path="/groups/:groupDid/events/:eventRkey"
            element={<EventDetailPage apiUrl={API_URL} />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('EventDetailPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  function setupFetch(permissions = MEMBER_PERMISSIONS) {
    fetchSpy.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes(`/events/${EVENT_RKEY}/rsvps`)) {
        return makeFetchResponse(mockAttendees);
      }
      if (urlStr.includes(`/events/${EVENT_RKEY}`)) {
        return makeFetchResponse({ event: mockEvent });
      }
      if (urlStr.includes('/permissions')) {
        return makeFetchResponse({ permissions });
      }
      return makeFetchResponse({});
    });
  }

  it('renders the event hero with title and description', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
      expect(screen.getByText(/A weekend of books/)).toBeInTheDocument();
    });
  });

  it('renders RsvpButton', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      // RsvpButton renders "Going", "Maybe", "Not Going"
      expect(screen.getByText(/going/i)).toBeInTheDocument();
    });
  });

  it('renders AttendeeList with going attendees', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });
  });

  it('admin user sees Edit and Delete controls', async () => {
    setupFetch(ADMIN_PERMISSIONS);
    renderPage();

    await waitFor(() => {
      // Kebab menu or direct buttons — either aria-label or text
      const editOrKebab =
        screen.queryByRole('button', { name: /edit/i }) ??
        screen.queryByRole('menuitem', { name: /edit/i }) ??
        screen.queryByLabelText(/more options/i) ??
        screen.queryByTestId('event-kebab-menu');
      expect(editOrKebab).toBeInTheDocument();
    });
  });

  it('non-admin user does NOT see Edit or Delete controls', async () => {
    setupFetch(MEMBER_PERMISSIONS);
    renderPage();

    // Wait for page to fully load
    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument();
  });
});
