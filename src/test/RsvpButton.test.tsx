/**
 * RsvpButton component tests
 *
 * Tests against src/components/events/RsvpButton.tsx.
 *
 * RsvpButtonProps:
 *   { eventRkey, groupDid, currentStatus?, disabled?, isPast?, apiUrl, onStatusChange? }
 *
 * RSVP options: "Going" | "Maybe" | "Can't make it"
 * API: PUT/DELETE /groups/:groupDid/events/:eventRkey/rsvp
 * Optimistic update: immediately marks button selected, reverts on error.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from '../components/ui/provider';
import { RsvpButton } from '../components/events/RsvpButton';

const EVENT_RKEY = 'evt-rsvp-test';
const GROUP_DID = 'did:plc:community1';
const API_URL = 'http://test.api';

function renderButton(currentStatus: string | null = null) {
  return render(
    <Provider>
      <RsvpButton
        eventRkey={EVENT_RKEY}
        groupDid={GROUP_DID}
        currentStatus={currentStatus as any}
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

  it('renders Going, Maybe, and Cannot-make-it buttons', () => {
    renderButton();
    expect(screen.getByText('Going')).toBeInTheDocument();
    expect(screen.getByText('Maybe')).toBeInTheDocument();
    expect(screen.getByText(/can't make it/i)).toBeInTheDocument();
  });

  it('clicking "Going" calls PUT /groups/:groupDid/events/:rkey/rsvp', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    renderButton();
    await userEvent.click(screen.getByText('Going'));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/groups/${encodeURIComponent(GROUP_DID)}/events/${encodeURIComponent(EVENT_RKEY)}/rsvp`),
        expect.objectContaining({
          method: 'PUT',
          credentials: 'include',
          body: expect.stringContaining('going'),
        })
      );
    });
  });

  it('optimistically marks the "Going" button as selected immediately on click', async () => {
    // Never resolve — test the intermediate optimistic state
    fetchSpy.mockReturnValueOnce(new Promise(() => {}));

    renderButton();
    const goingBtn = screen.getByText('Going');
    await userEvent.click(goingBtn);

    // aria-checked="true" is set optimistically
    await waitFor(() => {
      const btn = goingBtn.closest('button') ?? goingBtn;
      expect(btn.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('reverts to unselected when the PUT request fails', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    renderButton(null);
    await userEvent.click(screen.getByText('Going'));

    await waitFor(() => {
      const btn = screen.getByText('Going').closest('button') ?? screen.getByText('Going');
      expect(btn.getAttribute('aria-checked')).not.toBe('true');
    });
  });

  it('shows "This event has passed" when isPast is true', () => {
    render(
      <Provider>
        <RsvpButton eventRkey={EVENT_RKEY} groupDid={GROUP_DID} apiUrl={API_URL} isPast />
      </Provider>
    );
    expect(screen.getByText(/this event has passed/i)).toBeInTheDocument();
  });
});
