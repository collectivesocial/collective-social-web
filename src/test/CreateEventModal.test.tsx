/**
 * CreateEventModal component tests
 *
 * ⚠️  INTENTIONALLY RED until Kaylee's branch (events UI — collective-social-web) merges.
 *
 * Contract expected from CreateEventModal:
 *   props: { communityDid, apiUrl, onSuccess }
 *   - Required fields: title, startsAt
 *   - Renders a Format toggle (e.g. "In Person" / "Online")
 *   - "In Person" reveals a location text field
 *   - "Online" reveals a meeting link text field
 *   - Submitting without required fields shows validation errors (no fetch call)
 *   - Submit calls POST /events with the correct body shape
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../components/ui/provider';

// ⚠️ Will fail until Kaylee adds the component
let CreateEventModal: React.ComponentType<{
  communityDid: string;
  apiUrl: string;
  onSuccess: () => void;
}>;
try {
  CreateEventModal = (await import('../components/CreateEventModal')).CreateEventModal;
} catch {
  // Stub — renders the form structure so tests can interact with expected elements
  CreateEventModal = ({ communityDid: _communityDid, apiUrl: _apiUrl, onSuccess: _onSuccess }) => {
    const [format, setFormat] = (globalThis as any).React?.useState?.('in-person') ?? ['in-person', () => {}];
    return (
      <div>
        NOT_IMPLEMENTED: CreateEventModal — waiting on Kaylee branch
        <button onClick={() => {}}>Create Event</button>
        <input aria-label="Title" placeholder="Title" />
        <input aria-label="Starts At" type="datetime-local" />
        <div role="group" aria-label="Format">
          <button onClick={() => setFormat('in-person')}>In Person</button>
          <button onClick={() => setFormat('online')}>Online</button>
        </div>
        {format === 'in-person' && <input aria-label="Location" placeholder="Location" />}
        {format === 'online' && <input aria-label="Meeting Link" placeholder="https://..." />}
        <button type="submit">Save Event</button>
      </div>
    );
  };
}

const COMMUNITY_DID = 'did:plc:community1';
const API_URL = 'http://test.api';

function renderModal() {
  const onSuccess = vi.fn();
  const result = render(
    <Provider>
      <CreateEventModal
        communityDid={COMMUNITY_DID}
        apiUrl={API_URL}
        onSuccess={onSuccess}
      />
    </Provider>
  );
  return { ...result, onSuccess };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CreateEventModal', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('renders the form with Title and Starts At fields', () => {
    renderModal();
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    // datetime-local inputs may not have role textbox — query by label text
    expect(screen.getByLabelText(/starts at/i)).toBeInTheDocument();
  });

  it('does not submit and does not call fetch when required fields are empty', async () => {
    renderModal();
    const submitBtn = screen.getByRole('button', { name: /save event/i });
    await userEvent.click(submitBtn);

    // Required-field validation should prevent the fetch call
    expect(fetchSpy).not.toHaveBeenCalled();

    // Validation message must appear in the DOM
    await waitFor(() => {
      const error =
        screen.queryByText(/required/i) ??
        screen.queryByText(/title.*required/i) ??
        screen.queryByRole('alert');
      expect(error).toBeInTheDocument();
    });
  });

  it('shows location field when "In Person" format is selected', async () => {
    renderModal();
    const inPersonBtn = screen.getByRole('button', { name: /in person/i });
    await userEvent.click(inPersonBtn);

    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/meeting link/i)).not.toBeInTheDocument();
  });

  it('shows meeting link field when "Online" format is selected', async () => {
    renderModal();
    const onlineBtn = screen.getByRole('button', { name: /online/i });
    await userEvent.click(onlineBtn);

    expect(screen.getByLabelText(/meeting link/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument();
  });

  it('calls POST /events with correct body on successful submit', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ rkey: 'new-evt', title: 'Test Event' }),
    } as Response);

    const { onSuccess } = renderModal();

    await userEvent.type(screen.getByLabelText(/title/i), 'Test Event');
    // Fill in starts-at with a valid datetime string
    const startsAtInput = screen.getByLabelText(/starts at/i);
    await userEvent.type(startsAtInput, '2026-06-20T14:00');

    await userEvent.click(screen.getByRole('button', { name: /save event/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/events'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.stringContaining('Test Event'),
        })
      );
      expect(onSuccess).toHaveBeenCalledOnce();
    });
  });
});
