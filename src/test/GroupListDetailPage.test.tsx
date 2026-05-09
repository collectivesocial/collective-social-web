/**
 * Tests for GroupListDetailPage.
 *
 * Regression 1 (inline status error): when PUT /items/:rkey/status rejects,
 *   the Change Status dialog must display inline error text instead of
 *   silently swallowing the failure.
 *
 * Also verifies: "In Progress" status chip renders for status === 'in-progress'.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from '../components/ui/provider';
import { GroupListDetailPage } from '../pages/GroupListDetailPage';

// ── Constants ─────────────────────────────────────────────────────

const API_URL = 'http://test.api';
const GROUP_DID = 'did:plc:community1';
const LIST_RKEY = 'list1';
const ITEM_RKEY = 'item1';

// ── Fixtures ──────────────────────────────────────────────────────

const mockList = {
  uri: `at://${GROUP_DID}/app.collectivesocial.group.list/${LIST_RKEY}`,
  rkey: LIST_RKEY,
  name: 'Test Book Club',
  description: 'A great club',
  purpose: 'book-club',
  createdBy: 'did:plc:creator',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockItem = {
  uri: `at://${GROUP_DID}/app.collectivesocial.group.listitem/${ITEM_RKEY}`,
  rkey: ITEM_RKEY,
  title: 'The Fellowship of the Ring',
  creator: 'J.R.R. Tolkien',
  mediaType: 'book',
  order: 1,
  addedBy: 'did:plc:creator',
  status: 'in-progress',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockPermissions = {
  'app.collectivesocial.group.list': { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  'app.collectivesocial.group.listitem': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  'app.collectivesocial.group.listitem.status': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
};

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <Provider>
      <MemoryRouter initialEntries={[`/groups/${GROUP_DID}/lists/${LIST_RKEY}`]}>
        <Routes>
          <Route
            path="/groups/:groupDid/lists/:listRkey"
            element={<GroupListDetailPage apiUrl={API_URL} />}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('GroupListDetailPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders the "In Progress" status chip when an item has status in-progress', async () => {
    fetchSpy.mockImplementation(async (url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes(`/lists/${LIST_RKEY}`)) {
        return makeFetchResponse({ list: mockList, items: [mockItem] });
      }
      if (urlStr.includes('/groups/') && !urlStr.includes('/lists/')) {
        return makeFetchResponse({ permissions: mockPermissions });
      }
      return makeFetchResponse({});
    });

    renderPage();

    // Wait for the list to load and item to appear
    const chip = await screen.findByText('In Progress');
    expect(chip).toBeInTheDocument();
  });

  it('shows inline error text in the status dialog when the PUT request fails', async () => {
    let putAttempted = false;

    fetchSpy.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (urlStr.includes(`/lists/${LIST_RKEY}`) && method === 'GET') {
        return makeFetchResponse({ list: mockList, items: [mockItem] });
      }
      // Group detail fetch returns permissions (no /lists/ segment in path)
      if (urlStr.includes('/groups/') && !urlStr.includes('/lists/') && method === 'GET') {
        return makeFetchResponse({ permissions: mockPermissions });
      }
      if (urlStr.includes('/status') && method === 'PUT') {
        putAttempted = true;
        return makeFetchResponse({ error: 'Server error' }, false, 500);
      }
      return makeFetchResponse({});
    });

    renderPage();

    // Wait for the page to finish loading and the status change button to appear
    const changeStatusButton = await screen.findByText('Change Status');
    await userEvent.click(changeStatusButton);

    // Dialog should now be open — click "Update Status"
    const updateButton = await screen.findByText('Update Status');
    await userEvent.click(updateButton);

    // The inline error text must appear inside the dialog (Kaylee's fix)
    await waitFor(() => {
      expect(putAttempted).toBe(true);
      // The catch block sets statusError to err.message ('Failed to change status')
      // or falls back to a friendlier message — either must be in the DOM.
      const errorEl =
        screen.queryByText(/failed to change status/i) ??
        screen.queryByText(/couldn't update the status/i);
      expect(errorEl).toBeInTheDocument();
    });
  });
});
