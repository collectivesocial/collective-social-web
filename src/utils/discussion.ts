/**
 * Determine if a user can see the discussion for a segment.
 *
 * Rules:
 * - Admins (users who can create segments) always bypass the spoiler gate
 * - Users who have completed this segment can see its discussion
 * - Users who have completed any later-ordered segment can see earlier discussions
 */
export function canSeeDiscussion(
  seg: { uri: string; order: number },
  segments: { uri: string; order: number }[],
  myProgressSet: Set<string>,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  if (myProgressSet.has(seg.uri)) return true;
  for (const s of segments) {
    if (s.order > seg.order && myProgressSet.has(s.uri)) return true;
  }
  return false;
}
