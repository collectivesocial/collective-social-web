/**
 * EventCard component tests
 *
 * Tests against the EventCard component in src/components/events/EventCard.tsx.
 * EventCard renders a card for a GroupEvent with title, formatted datetime,
 * RSVP count, and an urgency badge for ongoing/upcoming-soon events.
 *
 * GroupEvent interface:
 *   { uri, rkey, name, startsAt, endsAt?, description?, mode, location?,
 *     status: 'upcoming'|'ongoing'|'past'|'cancelled',
 *     rsvpCounts: { going, interested, notgoing }, myRsvp? }
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from '../components/ui/provider';
import { EventCard } from '../components/events/EventCard';

const GROUP_DID = 'did:plc:community1';

const mockEvent = {
  uri: `at://${GROUP_DID}/app.collectivesocial.group.event/evt-test-1`,
  rkey: 'evt-test-1',
  name: 'Book Club Kickoff',
  startsAt: '2026-06-15T18:00:00.000Z',
  endsAt: '2026-06-15T20:00:00.000Z',
  description: 'First session',
  mode: 'in_person' as const,
  location: 'The Library',
  rsvpCounts: { going: 12, interested: 3, notgoing: 1 },
  status: 'upcoming' as const,
};

const mockOngoingEvent = {
  ...mockEvent,
  rkey: 'evt-test-2',
  name: 'Live Reading Session',
  status: 'ongoing' as const,
};

function renderCard(event: typeof mockEvent | typeof mockOngoingEvent) {
  return render(
    <Provider>
      <MemoryRouter>
        <EventCard event={event} groupDid={GROUP_DID} />
      </MemoryRouter>
    </Provider>
  );
}

afterEach(cleanup);

describe('EventCard', () => {
  it('renders the event name', () => {
    renderCard(mockEvent);
    expect(screen.getByText('Book Club Kickoff')).toBeInTheDocument();
  });

  it('renders a formatted datetime from startsAt', () => {
    renderCard(mockEvent);
    // The component formats to locale string — match year or month
    const dateEl = screen.getByText(/2026|June|Jun|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i);
    expect(dateEl).toBeInTheDocument();
  });

  it('renders the RSVP going count', () => {
    renderCard(mockEvent);
    // Expect "12 going" (or just "12") to appear somewhere on the card
    expect(screen.getByText(/12/)).toBeInTheDocument();
  });

  it('does NOT show "Now" badge for an upcoming event', () => {
    renderCard(mockEvent);
    expect(screen.queryByText(/^now$/i)).not.toBeInTheDocument();
  });

  it('shows "Now" badge when status is ongoing', () => {
    renderCard(mockOngoingEvent);
    expect(screen.getByText(/^now$/i)).toBeInTheDocument();
  });
});
