/**
 * EventDetailPage component tests
 *
 * Tests against src/pages/EventDetailPage.tsx.
 *
 * Route params: /groups/:groupDid/events/:eventRkey
 * Props: { apiUrl: string }
 * Fetches:
 *   GET /groups/:groupDid/events/:eventRkey → { event: GroupEvent }
 *   GET /groups/:groupDid/events/:eventRkey/rsvps → { going, interested, notgoing }
 *   GET /groups/:groupDid → { community: {...}, is_admin: boolean }
 *
 * Renders: event title, description, RsvpButton, AttendeeList
 * Admin: is_admin=true from group fetch → shows Edit/Delete kebab menu
 * Non-admin: is_admin=false → no Edit/Delete controls
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
  going: [{ did: 'did:plc:user001', handle: 'alice.bsky.social', displayName: 'Alice' }],
  interested: [{ did: 'did:plc:user002', handle: 'bob.bsky.social', displayName: 'Bob' }],
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
      // Group detail fetch
      if (urlStr.includes(`/groups/${encodeURIComponent(GROUP_DID)}`) || urlStr.includes(`/groups/${GROUP_DID}`)) {
        return makeFetchResponse({ community: { display_name: 'Book Club' }, is_admin: isAdmin });
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

  it('renders AttendeeList with going attendees', async () => {
    setupFetch();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/alice/i)).toBeInTheDocument();
    });
  });

  it('admin user sees the kebab/edit menu button', async () => {
    setupFetch(true /* isAdmin */);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });

    // The edit/delete button is a kebab icon button — check for it or the delete button
    const editDelete =
      screen.queryByRole('button', { name: /delete/i }) ??
      screen.queryByRole('button', { name: /edit/i }) ??
      screen.queryByTestId('event-kebab-menu') ??
      screen.queryByLabelText(/more options/i);
    expect(editDelete).toBeInTheDocument();
  });

  it('non-admin user does NOT see Edit or Delete controls', async () => {
    setupFetch(false /* isAdmin */);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Annual Reading Retreat')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
  });
});
