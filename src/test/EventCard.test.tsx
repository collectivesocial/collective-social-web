/**
 * EventCard component tests
 *
 * Tests against src/components/events/EventCard.tsx.
 *
 * EventCard renders:
 *   - event.name (the event title)
 *   - formatted startsAt datetime
 *   - total RSVP count: going + interested (shown as "N people")
 *   - "Now" badge when status === 'ongoing'
 *   - No badge for 'upcoming' events (unless starting very soon)
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
  // total = going(12) + interested(3) = 15 people
  rsvpCounts: { going: 12, interested: 3, notgoing: 1 },
  status: 'upcoming' as const,
};

const mockOngoingEvent = {
  ...mockEvent,
  rkey: 'evt-test-2',
  name: 'Live Reading Session',
  status: 'ongoing' as const,
};

function renderCard(event: typeof mockEvent) {
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
    // The component formats to locale string — match day-of-week or month
    const dateEl = screen.getByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i);
    expect(dateEl).toBeInTheDocument();
  });

  it('renders the combined going+interested count as "N people"', () => {
    renderCard(mockEvent);
    // 12 going + 3 interested = 15 people
    expect(screen.getByText(/15\s*people/i)).toBeInTheDocument();
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
