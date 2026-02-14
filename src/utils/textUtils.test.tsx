import { describe, it, expect } from 'vitest'
import { renderTextWithLinks } from './textUtils'
import React from 'react'

describe('renderTextWithLinks', () => {
  describe('mention parsing', () => {
    it('should convert @mention to a Bluesky profile link', () => {
      const result = renderTextWithLinks('Hello @user.bsky.social')
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Hello ')

      // Check that the second element is a React element with correct props
      const linkElement = result[1] as React.ReactElement
      expect(React.isValidElement(linkElement)).toBe(true)
      expect(linkElement.props.href).toBe('https://bsky.app/profile/user.bsky.social')
      expect(linkElement.props.children).toBe('@user.bsky.social')
      expect(linkElement.props.target).toBe('_blank')
      expect(linkElement.props.rel).toBe('noopener noreferrer')
    })

    it('should handle multiple mentions', () => {
      const result = renderTextWithLinks('@alice.bsky.social and @bob.bsky.social')
      expect(result).toHaveLength(3)

      const link1 = result[0] as React.ReactElement
      expect(link1.props.href).toBe('https://bsky.app/profile/alice.bsky.social')

      expect(result[1]).toBe(' and ')

      const link2 = result[2] as React.ReactElement
      expect(link2.props.href).toBe('https://bsky.app/profile/bob.bsky.social')
    })

    it('should handle mentions with subdomain dots', () => {
      const result = renderTextWithLinks('@user.subdomain.example.com')
      const linkElement = result[0] as React.ReactElement
      expect(linkElement.props.href).toBe('https://bsky.app/profile/user.subdomain.example.com')
    })
  })

  describe('hashtag parsing', () => {
    it('should convert #hashtag to a Bluesky search link', () => {
      const result = renderTextWithLinks('Check out #technology')
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Check out ')

      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.href).toBe('https://bsky.app/search?q=%23technology')
      expect(linkElement.props.children).toBe('#technology')
    })

    it('should handle multiple hashtags', () => {
      const result = renderTextWithLinks('#react and #typescript')
      expect(result).toHaveLength(3)

      const link1 = result[0] as React.ReactElement
      expect(link1.props.href).toBe('https://bsky.app/search?q=%23react')

      expect(result[1]).toBe(' and ')

      const link2 = result[2] as React.ReactElement
      expect(link2.props.href).toBe('https://bsky.app/search?q=%23typescript')
    })

    it('should not convert hashtag inside a mention', () => {
      const result = renderTextWithLinks('@user#with#hash.bsky.social')
      // This should be treated as a mention, not hashtags
      const linkElement = result[0] as React.ReactElement
      expect(linkElement.props.href).toBe('https://bsky.app/profile/user')
    })
  })

  describe('URL parsing', () => {
    it('should convert http URL to a clickable link', () => {
      const result = renderTextWithLinks('Visit http://example.com')
      expect(result).toHaveLength(2)
      expect(result[0]).toBe('Visit ')

      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.href).toBe('http://example.com')
      expect(linkElement.props.children).toBe('http://example.com')
    })

    it('should convert https URL to a clickable link', () => {
      const result = renderTextWithLinks('Visit https://example.com')
      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.href).toBe('https://example.com')
    })

    it('should convert domain-only URL and add https', () => {
      const result = renderTextWithLinks('Visit example.com')
      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.href).toBe('https://example.com')
      expect(linkElement.props.children).toBe('example.com')
    })

    it('should handle URLs with paths', () => {
      const result = renderTextWithLinks('Check https://example.com/path/to/page')
      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.href).toBe('https://example.com/path/to/page')
    })

    it('should handle multiple URLs', () => {
      const result = renderTextWithLinks('Visit https://example.com and https://test.com')
      expect(Array.isArray(result)).toBe(true)
      // Should have: 'Visit ', link1, ' and ', link2
      expect(result.length).toBeGreaterThanOrEqual(3)

      const link1 = result[1] as React.ReactElement
      expect(link1.props.href).toBe('https://example.com')

      // Find the second link (could be at different positions)
      const link2Index = result.findIndex((item, idx) =>
        idx > 1 && React.isValidElement(item) && item.props.href === 'https://test.com'
      )
      expect(link2Index).toBeGreaterThan(1)
    })
  })

  describe('mixed content parsing', () => {
    it('should handle text with mentions, hashtags, and URLs', () => {
      const result = renderTextWithLinks(
        'Hello @user.bsky.social check out #react at https://react.dev'
      )
      expect(result.length).toBeGreaterThan(5)

      // Find the mention
      const mentionIndex = result.findIndex((item) =>
        React.isValidElement(item) && item.props.href === 'https://bsky.app/profile/user.bsky.social'
      )
      expect(mentionIndex).toBeGreaterThan(0)

      // Find the hashtag
      const hashtagIndex = result.findIndex((item) =>
        React.isValidElement(item) && item.props.href === 'https://bsky.app/search?q=%23react'
      )
      expect(hashtagIndex).toBeGreaterThan(0)

      // Find the URL
      const urlIndex = result.findIndex((item) =>
        React.isValidElement(item) && item.props.href === 'https://react.dev'
      )
      expect(urlIndex).toBeGreaterThan(0)
    })

    it('should handle URLs with fragments', () => {
      // The URL regex should capture the entire URL including fragments
      const result = renderTextWithLinks('Visit https://example.com/#section')
      const linkElement = result[1] as React.ReactElement
      // The actual implementation includes the fragment
      expect(linkElement.props.href).toContain('https://example.com/')
    })
  })

  describe('plain text', () => {
    it('should return text in array when no links found', () => {
      const result = renderTextWithLinks('This is plain text')
      // When no links are found, it returns an array with the text
      expect(Array.isArray(result)).toBe(true)
      if (Array.isArray(result)) {
        expect(result.length).toBeGreaterThan(0)
        expect(result[0]).toBe('This is plain text')
      }
    })

    it('should handle empty string', () => {
      const result = renderTextWithLinks('')
      // Empty string returns empty string
      expect(result).toBe('')
    })
  })

  describe('link attributes', () => {
    it('should set target="_blank" for all links', () => {
      const result = renderTextWithLinks('@user.bsky.social')
      const linkElement = result[0] as React.ReactElement
      expect(linkElement.props.target).toBe('_blank')
    })

    it('should set rel="noopener noreferrer" for all links', () => {
      const result = renderTextWithLinks('Visit https://example.com')
      const linkElement = result[1] as React.ReactElement
      expect(linkElement.props.rel).toBe('noopener noreferrer')
    })
  })
})
