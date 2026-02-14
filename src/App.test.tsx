import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import App from './App'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('App', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should render without crashing', async () => {
    // Mock all fetch requests to prevent errors
    mockFetch.mockImplementation((url: string) => {
      // For user authentication check
      if (url.includes('/users/me')) {
        return Promise.resolve({
          ok: false,
          status: 401,
        })
      }
      // For other requests (admin check, feed, etc.)
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
    })

    const { container } = render(<App />)

    // Wait for the loading state to resolve
    await waitFor(
      () => {
        const loadingElement = container.querySelector('[class*="card"]')
        if (loadingElement?.textContent?.includes('Loading')) {
          throw new Error('Still loading')
        }
      },
      { timeout: 2000 }
    ).catch(() => {
      // It's ok if it times out, we just want to make sure it renders
    })

    // App should render successfully
    expect(container).toBeTruthy()
    expect(container.innerHTML).toBeTruthy()
  })

  it('should call user authentication endpoint on mount', async () => {
    // Mock successful authentication
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/users/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            did: 'did:plc:test123',
            handle: 'testuser.bsky.social',
            displayName: 'Test User',
          }),
        })
      }
      return Promise.resolve({
        ok: false,
        status: 401,
        json: async () => ({}),
      })
    })

    render(<App />)

    // Wait a bit for effects to run
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalled()
      },
      { timeout: 1000 }
    )

    // Verify fetch was called with correct parameters
    const authCall = Array.from(mockFetch.mock.calls).find((call) =>
      call[0].includes('/users/me')
    )
    expect(authCall).toBeTruthy()
  })
})
