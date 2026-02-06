import React from 'react';
import { Link as ChakraLink } from '@chakra-ui/react';

export const renderTextWithLinks = (text: string) => {
  // Regex patterns for different link types
  const mentionRegex = /@([a-zA-Z0-9._-]+(?:\.[a-zA-Z0-9._-]+)*)/g;
  const hashtagRegex = /#(\w+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)|((?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  const matches: Array<{ index: number; length: number; element: React.ReactElement }> = [];

  // Find all mentions
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(text)) !== null) {
    matches.push({
      index: match.index,
      length: match[0].length,
      element: (
        <ChakraLink
          key={`mention-${match.index}`}
          href={`https://bsky.app/profile/${match[1]}`}
          target="_blank"
          rel="noopener noreferrer"
          color="accent.default"
          _hover={{ textDecoration: 'underline' }}
        >
          {match[0]}
        </ChakraLink>
      ),
    });
  }

  // Find all hashtags
  hashtagRegex.lastIndex = 0;
  while ((match = hashtagRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchLength = match[0].length;
    // Check if this position is already covered by a mention
    const isOverlapped = matches.some(
      m => matchIndex >= m.index && matchIndex < m.index + m.length
    );
    if (!isOverlapped) {
      matches.push({
        index: matchIndex,
        length: matchLength,
        element: (
          <ChakraLink
            key={`hashtag-${matchIndex}`}
            href={`https://bsky.app/search?q=${encodeURIComponent(match[0])}`}
            target="_blank"
            rel="noopener noreferrer"
            color="accent.default"
            _hover={{ textDecoration: 'underline' }}
          >
            {match[0]}
          </ChakraLink>
        ),
      });
    }
  }

  // Find all URLs
  urlRegex.lastIndex = 0;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const matchIndex = match.index;
    const matchLength = match[0].length;
    const isOverlapped = matches.some(
      m => matchIndex >= m.index && matchIndex < m.index + m.length
    );
    if (!isOverlapped) {
      const href = url.startsWith('http') ? url : `https://${url}`;
      matches.push({
        index: matchIndex,
        length: matchLength,
        element: (
          <ChakraLink
            key={`url-${matchIndex}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            color="accent.default"
            _hover={{ textDecoration: 'underline' }}
          >
            {url}
          </ChakraLink>
        ),
      });
    }
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index);

  // Build the final array of text and link elements
  matches.forEach((m) => {
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index));
    }
    parts.push(m.element);
    lastIndex = m.index + m.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};
