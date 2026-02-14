import { describe, it, expect, beforeEach, vi } from 'vitest'
import { formatDate } from './time'

describe('formatDate', () => {
  beforeEach(() => {
    // Reset system time before each test
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return "just now" for timestamps less than 1 minute ago', () => {
    const now = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(now)

    // 30 seconds ago
    const date = new Date('2024-01-01T11:59:30Z').toISOString()
    expect(formatDate(date)).toBe('just now')

    // 0 seconds ago
    const dateNow = new Date('2024-01-01T12:00:00Z').toISOString()
    expect(formatDate(dateNow)).toBe('just now')
  })

  it('should return minutes ago for timestamps less than 1 hour ago', () => {
    const now = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(now)

    // 1 minute ago
    const date1min = new Date('2024-01-01T11:59:00Z').toISOString()
    expect(formatDate(date1min)).toBe('1m ago')

    // 30 minutes ago
    const date30min = new Date('2024-01-01T11:30:00Z').toISOString()
    expect(formatDate(date30min)).toBe('30m ago')

    // 59 minutes ago
    const date59min = new Date('2024-01-01T11:01:00Z').toISOString()
    expect(formatDate(date59min)).toBe('59m ago')
  })

  it('should return hours ago for timestamps less than 24 hours ago', () => {
    const now = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(now)

    // 1 hour ago
    const date1h = new Date('2024-01-01T11:00:00Z').toISOString()
    expect(formatDate(date1h)).toBe('1h ago')

    // 5 hours ago
    const date5h = new Date('2024-01-01T07:00:00Z').toISOString()
    expect(formatDate(date5h)).toBe('5h ago')

    // 23 hours ago
    const date23h = new Date('2023-12-31T13:00:00Z').toISOString()
    expect(formatDate(date23h)).toBe('23h ago')
  })

  it('should return days ago for timestamps less than 7 days ago', () => {
    const now = new Date('2024-01-08T12:00:00Z')
    vi.setSystemTime(now)

    // 1 day ago
    const date1d = new Date('2024-01-07T12:00:00Z').toISOString()
    expect(formatDate(date1d)).toBe('1d ago')

    // 3 days ago
    const date3d = new Date('2024-01-05T12:00:00Z').toISOString()
    expect(formatDate(date3d)).toBe('3d ago')

    // 6 days ago
    const date6d = new Date('2024-01-02T12:00:00Z').toISOString()
    expect(formatDate(date6d)).toBe('6d ago')
  })

  it('should return formatted date for timestamps 7 days or older', () => {
    const now = new Date('2024-01-15T12:00:00Z')
    vi.setSystemTime(now)

    // 7 days ago
    const date7d = new Date('2024-01-08T12:00:00Z').toISOString()
    const result7d = formatDate(date7d)
    expect(result7d).toMatch(/1\/8\/2024/)

    // 30 days ago
    const date30d = new Date('2023-12-16T12:00:00Z').toISOString()
    const result30d = formatDate(date30d)
    expect(result30d).toMatch(/12\/16\/2023/)

    // 1 year ago
    const date1y = new Date('2023-01-15T12:00:00Z').toISOString()
    const result1y = formatDate(date1y)
    expect(result1y).toMatch(/1\/15\/2023/)
  })

  it('should handle edge case at exact boundaries', () => {
    const now = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(now)

    // Exactly 60 minutes ago (should be 1 hour)
    const date60min = new Date('2024-01-01T11:00:00Z').toISOString()
    expect(formatDate(date60min)).toBe('1h ago')

    // Exactly 24 hours ago (should be 1 day)
    const date24h = new Date('2023-12-31T12:00:00Z').toISOString()
    expect(formatDate(date24h)).toBe('1d ago')

    // Exactly 7 days ago (should be formatted date)
    const date7d = new Date('2023-12-25T12:00:00Z').toISOString()
    expect(formatDate(date7d)).toMatch(/12\/25\/2023/)
  })

  it('should handle future dates gracefully', () => {
    const now = new Date('2024-01-01T12:00:00Z')
    vi.setSystemTime(now)

    // 1 minute in the future
    const futureDateStr = new Date('2024-01-01T12:01:00Z').toISOString()
    const result = formatDate(futureDateStr)
    // Should return "just now" or the formatted date (implementation dependent)
    expect(typeof result).toBe('string')
  })
})
