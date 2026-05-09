/**
 * RsvpButton component tests
 *
 * ⚠️  INTENTIONALLY RED until Kaylee's branch (events UI — collective-social-web) merges.
 *
 * Contract expected from RsvpButton:
 *   props: { eventRkey, communityDid, initialStatus?: 'going'|'maybe'|'not-going'|null, apiUrl: string }
 *   - Renders three buttons: "Going", "Maybe", "Not Going"
 *   - Clicking "Going" calls PUT /events/:rkey/rsvp with { status: 'going', communityDid }
 *   - Optimistic update: button immediately shows as selected before API resolves
 *   - Reverts on error: if the mutation fails, the previous selection is restored
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../components/ui/provider';

// ⚠️ Will fail until Kaylee adds the component
let RsvpButton: React.ComponentType<{
  eventRkey: string;
  communityDid: string;
  initialStatus?: string | null;
  apiUrl: string;
}>;
try {
  RsvpButton = (await import('../components/RsvpButton')).RsvpButton;
} catch {
  RsvpButton = ({ eventRkey: _eventRkey, communityDid: _communityDid, initialStatus: _initialStatus, apiUrl: _apiUrl }) => (
    <div data-testid="rsvp-stub">
      NOT_IMPLEMENTED: RsvpButton — waiting on Kaylee branch
      <button data-rsvp="going">Going</button>
      <button data-rsvp="maybe">Maybe</button>
      <button data-rsvp="not-going">Not Going</button>
    </div>
  );
}

const EVENT_RKEY = 'evt-rsvp-test';
const COMMUNITY_DID = 'did:plc:community1';
const API_URL = 'http://test.api';

function renderButton(initialStatus: string | null = null) {
  return render(
    <Provider>
      <RsvpButton
        eventRkey={EVENT_RKEY}
        communityDid={COMMUNITY_DID}
        initialStatus={initialStatus}
        apiUrl={API_URL}
      />
    </Provider>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RsvpButton', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  it('renders Going, Maybe, and Not Going buttons', () => {
    renderButton();
    expect(screen.getByText(/going/i)).toBeInTheDocument();
    expect(screen.getByText(/maybe/i)).toBeInTheDocument();
    expect(screen.getByText(/not going/i)).toBeInTheDocument();
  });

  it('clicking "Going" calls PUT /events/:rkey/rsvp with correct body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'going' }),
    } as Response);

    renderButton();
    await userEvent.click(screen.getByText(/^going$/i));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/events/${EVENT_RKEY}/rsvp`),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"going"'),
          credentials: 'include',
        })
      );
    });
  });

  it('optimistically marks the button as selected before API resolves', async () => {
    // Never resolve — test the intermediate state
    fetchSpy.mockReturnValueOnce(new Promise(() => {}));

    renderButton();
    const goingBtn = screen.getByText(/^going$/i);
    await userEvent.click(goingBtn);

    // Button should immediately reflect selected state (aria-pressed, data-selected, etc.)
    await waitFor(() => {
      const btn = screen.getByText(/^going$/i).closest('button') ?? screen.getByText(/^going$/i);
      const isSelected =
        btn.getAttribute('aria-pressed') === 'true' ||
        btn.getAttribute('data-selected') === 'true' ||
        btn.classList.contains('selected') ||
        btn.getAttribute('data-state') === 'active';
      expect(isSelected).toBe(true);
    });
  });

  it('reverts to previous state when the mutation fails', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    // Start with no RSVP
    renderButton(null);
    await userEvent.click(screen.getByText(/^going$/i));

    await waitFor(() => {
      // After failure, "Going" should no longer appear selected
      const btn = screen.getByText(/^going$/i).closest('button') ?? screen.getByText(/^going$/i);
      const isSelected =
        btn.getAttribute('aria-pressed') === 'true' ||
        btn.getAttribute('data-selected') === 'true';
      expect(isSelected).toBeFalsy();
    });
  });
});
