import { describe, it, expect } from 'vitest';
import { canSeeDiscussion } from '../utils/discussion';

const seg1 = { uri: 'at://group/seg/1', order: 1 };
const seg2 = { uri: 'at://group/seg/2', order: 2 };
const seg3 = { uri: 'at://group/seg/3', order: 3 };
const allSegments = [seg1, seg2, seg3];

describe('canSeeDiscussion', () => {
  it('allows admins to see any discussion regardless of progress', () => {
    const noProgress = new Set<string>();
    expect(canSeeDiscussion(seg1, allSegments, noProgress, true)).toBe(true);
    expect(canSeeDiscussion(seg2, allSegments, noProgress, true)).toBe(true);
    expect(canSeeDiscussion(seg3, allSegments, noProgress, true)).toBe(true);
  });

  it('allows users who completed the segment to see its discussion', () => {
    const progress = new Set([seg2.uri]);
    expect(canSeeDiscussion(seg2, allSegments, progress, false)).toBe(true);
  });

  it('blocks users who have not completed the segment', () => {
    const noProgress = new Set<string>();
    expect(canSeeDiscussion(seg1, allSegments, noProgress, false)).toBe(false);
  });

  it('allows users who completed a later segment to see earlier discussions', () => {
    const progress = new Set([seg3.uri]);
    expect(canSeeDiscussion(seg1, allSegments, progress, false)).toBe(true);
    expect(canSeeDiscussion(seg2, allSegments, progress, false)).toBe(true);
  });

  it('does not allow users who completed an earlier segment to see later discussions', () => {
    const progress = new Set([seg1.uri]);
    expect(canSeeDiscussion(seg2, allSegments, progress, false)).toBe(false);
    expect(canSeeDiscussion(seg3, allSegments, progress, false)).toBe(false);
  });

  it('handles single segment case', () => {
    const oneSeg = [seg1];
    expect(canSeeDiscussion(seg1, oneSeg, new Set(), false)).toBe(false);
    expect(canSeeDiscussion(seg1, oneSeg, new Set([seg1.uri]), false)).toBe(true);
    expect(canSeeDiscussion(seg1, oneSeg, new Set(), true)).toBe(true);
  });

  it('handles empty segments list', () => {
    expect(canSeeDiscussion(seg1, [], new Set(), false)).toBe(false);
    expect(canSeeDiscussion(seg1, [], new Set(), true)).toBe(true);
  });
});
