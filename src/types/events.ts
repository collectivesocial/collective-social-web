export type RsvpStatus = 'going' | 'interested' | 'notgoing'

export interface GroupEvent {
  uri: string
  rkey: string
  name: string
  startsAt: string
  endsAt?: string
  description?: string
  mode: 'in_person' | 'virtual' | 'hybrid'
  location?: string
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  rsvpCounts: { going: number; interested: number; notgoing: number }
  myRsvp?: RsvpStatus | null
}

export interface RsvpEntry {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

export interface RsvpAggregate {
  going: RsvpEntry[]
  interested: RsvpEntry[]
  notgoing: RsvpEntry[]
}
