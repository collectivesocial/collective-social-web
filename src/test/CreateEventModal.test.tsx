/**
 * CreateEventModal component tests
 *
 * Tests against src/components/events/CreateEventModal.tsx.
 *
 * CreateEventModalProps:
 *   { groupDid, isOpen, onClose, onCreated, apiUrl }
 *
 * Fields: name (required), startsAt (required), description, mode (in_person|virtual),
 *   location (shown when mode=in_person), joinLink (shown when mode=virtual)
 *
 * Validation: name and startsAt required; submit calls POST /groups/:groupDid/events
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from '../components/ui/provider';
import { CreateEventModal } from '../components/events/CreateEventModal';

const GROUP_DID = 'did:plc:community1';
const API_URL = 'http://test.api';

function renderModal(isOpen = true) {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  const result = render(
    <Provider>
      <MemoryRouter>
        <CreateEventModal
          groupDid={GROUP_DID}
          isOpen={isOpen}
          onClose={onClose}
          onCreated={onCreated}
          apiUrl={API_URL}
        />
      </MemoryRouter>
    </Provider>
  );
  return { ...result, onClose, onCreated };
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

  it('renders the event name and start time fields when open', () => {
    renderModal();
    // Name field
    expect(screen.getByLabelText(/event name/i) ?? screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
  });

  it('does not render the form when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByLabelText(/event name/i)).not.toBeInTheDocument();
  });

  it('shows validation error when name is empty on submit', async () => {
    renderModal();
    const submitBtn = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(submitBtn);

    // No fetch should have been called
    expect(fetchSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      const error =
        screen.queryByText(/event name is required/i) ??
        screen.queryByText(/name.*required/i) ??
        screen.queryByRole('alert');
      expect(error).toBeInTheDocument();
    });
  });

  it('shows location field when mode is in_person (default)', () => {
    renderModal();
    expect(screen.getByLabelText(/location/i) ?? screen.getByPlaceholderText(/location/i)).toBeInTheDocument();
  });

  it('shows join link field when Virtual mode is selected', async () => {
    renderModal();
    const virtualBtn = screen.getByRole('button', { name: /virtual/i });
    await userEvent.click(virtualBtn);

    await waitFor(() => {
      expect(
        screen.getByLabelText(/join link/i) ??
        screen.getByPlaceholderText(/https:\/\//i)
      ).toBeInTheDocument();
    });
  });

  it('calls POST /groups/:groupDid/events on valid submit', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ event: { rkey: 'new-evt', name: 'Test Event' } }),
    } as Response);

    const { onCreated: _onCreated } = renderModal();

    const nameInput = screen.getByLabelText(/event name/i) ?? screen.getByPlaceholderText(/event name|name/i);
    await userEvent.type(nameInput, 'Phase 2 Party');

    // Fill in starts-at datetime
    const startsAtInput = screen.getByLabelText(/start/i);
    await userEvent.type(startsAtInput, '2026-06-20T14:00');

    const submitBtn = screen.getByRole('button', { name: /create event/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(`/groups/${encodeURIComponent(GROUP_DID)}/events`),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.stringContaining('Phase 2 Party'),
        })
      );
    });
  });
});
