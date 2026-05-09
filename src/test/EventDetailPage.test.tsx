/**
 * EventDetailPage component tests
 *
 * Tests against src/pages/EventDetailPage.tsx.
 *
 * Route: /groups/:groupDid/events/:eventRkey
 * Props: { apiUrl: string }
 *
 * Fetches (concurrently):
 *   GET /groups/:groupDid/events/:eventRkey      → { event: GroupEvent }
 *   GET /groups/:groupDid/events/:eventRkey/rsvps → { going, interested, notgoing }
 *   GET /groups/:groupDid                         → { community: {...}, is_admin: boolean }
 *
 * Admin controls: button with aria-label="Event options" (kebab menu)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from '../components/ui/provider';
import { EventDetailPage } from '../pages/EventDetailPage';

const GROUP_DID = 'did:plc:community1';
const EVENT_RKEY = 'evt-detail-test';
const API_URL = 'http://test.api';

const mockEvent = {
  uri: `at://${GROUP_DID}/app.collectivesocial.group.event/${EVENT_RKEY}`,
  rkey: EVENT_RKEY,
  name: 'Annual Reading Retreat',
  description: 'A weekend of books and discussion.',
  startsAt: '2026-07-10T10:00:00.000Z',
  endsAt: '2026-07-12T17:00:00.000Z',
  mode: 'in_person' as const,
  location: 'Mountain Cabin',
  status: 'upcoming' as const,
  rsvpCounts: { going: 8, interested: 2, notgoing: 0 },
};

const mockAggregate = {
  going: [{ did: 'did:plc:user001', handle: 'alice.bsky.social', displayName: 'Alice Reader' }],
  interested: [{ did: 'did:plc:user002', handle: 'bob.bsky.social', displayName: 'Bob Writer' }],
  notgoing: [],
};

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

  function setupFetch(isAdmin = false) {
    fetchSpy.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes('/rsvps')) {
        return makeFetchResponse(mockAggregate);
      }
      if (urlStr.includes(`/events/${EVENT_RKEY}`)) {
        return makeFetchResponse({ event: mockEvent });
      }
      // Group detail — any /groups/:did path not containing /events/
      if (urlStr.includes('/groups/')) {
        return makeFetchResponse({
          community: { display_name: 'Book Club', handle: 'bookclub.bsky.social' },
          is_admin: isAdmin,
        });
      }
      return makeFetchResponse({});
    });
  }

  it('renders the event name and description', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });
    expect(screen.getByText(/A weekend of books/)).toBeInTheDocument();
  });

  it('renders RsvpButton (Going / Maybe / Cannot make it)', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Going')).toBeInTheDocument();
    });
  });

  it('renders AttendeeList with "Alice Reader" in the going section', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      // getAllByText returns multiple — just assert at least one is present
      const aliceEls = screen.queryAllByText(/alice reader/i);
      expect(aliceEls.length).toBeGreaterThan(0);
    });
  });

  it('admin user sees the "Event options" kebab button', async () => {
    setupFetch(true /* isAdmin */);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });

    const kebab = screen.queryByLabelText(/event options/i);
    expect(kebab).toBeInTheDocument();
  });

  it('non-admin user does NOT see the "Event options" kebab button', async () => {
    setupFetch(false /* isAdmin */);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/event options/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });
});
