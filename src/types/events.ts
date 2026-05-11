export type RsvpStatus = 'going' | 'interested' | 'notgoing';

export interface EventUri {
  uri: string;
  name?: string;
}

export interface EventLocation {
  name?: string;
  locality?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface GroupEvent {
  uri: string;
  rkey: string;
  name: string;
  startsAt: string;
  endsAt?: string;
  description?: string;
  mode: 'in_person' | 'virtual' | 'hybrid';
  /**
   * Free-form location string. Legacy field — new events use `locations[]` for
   * physical addresses and `uris[]` for join links. Kept here for backward
   * compatibility with records created before that split.
   */
  location?: string;
  /** Physical locations per `community.lexicon.calendar.event`. */
  locations?: EventLocation[];
  /** External URLs associated with the event (join links, signup pages, etc). */
  uris?: EventUri[];
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
  rsvpCounts: { going: number; interested: number; notgoing: number };
  myRsvp?: RsvpStatus | null;
}

export interface RsvpEntry {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface RsvpAggregate {
  going: RsvpEntry[];
  interested: RsvpEntry[];
  notgoing: RsvpEntry[];
}
