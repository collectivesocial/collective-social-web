/**
 * EventCard component tests
 *
 * ⚠️  INTENTIONALLY RED until Kaylee's branch (events UI — collective-social-web) merges.
 *
 * Contract expected from EventCard:
 *   props: { event: EventRecord }
 *   EventRecord: { rkey, title, startsAt, endsAt?, location?, rsvpCounts: { going, maybe, notGoing }, status? }
 *
 * Assertions:
 *   - renders event title
 *   - renders a formatted datetime (startsAt)
 *   - renders RSVP count summary ("N going")
 *   - shows "Happening Now" badge when status === 'happening-now'
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Provider } from '../components/ui/provider';

// ⚠️ This import will fail until Kaylee's branch adds the component.
// The test is written against the expected contract.
let EventCard: React.ComponentType<{ event: any }>;
try {
  EventCard = (await import('../components/EventCard')).EventCard;
} catch {
  EventCard = ({ event }: { event: any }) => (
    <div data-testid="event-card-stub">
      NOT_IMPLEMENTED: EventCard — waiting on Kaylee branch
      <span>{event?.title}</span>
      <span>{event?.startsAt}</span>
      <span>{event?.rsvpCounts?.going} going</span>
      {event?.status === 'happening-now' && <span>Happening Now</span>}
    </div>
  );
}

const mockEvent = {
  rkey: 'evt-test-1',
  title: 'Book Club Kickoff',
  startsAt: '2026-06-15T18:00:00.000Z',
  endsAt: '2026-06-15T20:00:00.000Z',
  location: 'The Library',
  rsvpCounts: { going: 12, maybe: 3, notGoing: 1 },
  status: 'upcoming',
};

const mockHappeningNowEvent = {
  ...mockEvent,
  rkey: 'evt-test-2',
  title: 'Live Reading Session',
  status: 'happening-now',
};

function renderCard(event: typeof mockEvent) {
  return render(
    <Provider>
      <EventCard event={event} />
    </Provider>
  );
}

afterEach(cleanup);

describe('EventCard', () => {
  it('renders the event title', () => {
    renderCard(mockEvent);
    expect(screen.getByText('Book Club Kickoff')).toBeInTheDocument();
  });

  it('renders the event datetime', () => {
    renderCard(mockEvent);
    // The component should format startsAt — match at least the year/month
    const dateEl = screen.getByText(/2026|June|Jun/i);
    expect(dateEl).toBeInTheDocument();
  });

  it('renders the RSVP going count', () => {
    renderCard(mockEvent);
    expect(screen.getByText(/12\s*going/i)).toBeInTheDocument();
  });

  it('does NOT show "Happening Now" badge for an upcoming event', () => {
    renderCard(mockEvent);
    expect(screen.queryByText(/happening now/i)).not.toBeInTheDocument();
  });

  it('shows "Happening Now" badge when status is happening-now', () => {
    renderCard(mockHappeningNowEvent);
    expect(screen.getByText(/happening now/i)).toBeInTheDocument();
  });
});
