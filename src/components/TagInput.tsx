import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { LuCheck, LuX } from 'react-icons/lu';

interface Tag {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

interface TagInputProps {
  apiUrl: string;
  itemId: number;
  onTagAdded: () => void;
  onCancel: () => void;
}

export function TagInput({ apiUrl, itemId, onTagAdded, onCancel }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

    // Handle clicks outside to close suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTags = async () => {
      if (inputValue.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${apiUrl}/tags/search?q=${encodeURIComponent(inputValue)}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.tags || []);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to search tags:', err);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTags, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, apiUrl]);

  const handleSubmit = async (tagName?: string) => {
    const nameToSubmit = tagName || inputValue.trim();

    if (!nameToSubmit) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/media/${itemId}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tagName: nameToSubmit }),
      });

      if (response.ok) {
        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        onTagAdded();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add tag');
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
      alert('Failed to add tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }

    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSubmit(suggestions[selectedIndex].name);
        } else {
          handleSubmit();
        }
        break;
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          setInputValue(suggestions[selectedIndex].name);
          setShowSuggestions(false);
        }
        break;
    }
  };

  return (
    <Box position="relative" w="full">
      <HStack gap={2}>
        <Box flex={1} position="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
            placeholder="Type a tag name..."
            size="sm"
            disabled={submitting}
            maxLength={36}
          />

          {showSuggestions && (suggestions.length > 0 || loading) && (
            <Box
              ref={suggestionsRef}
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={1}
              bg="bg.elevated"
              borderWidth="1px"
              borderColor="border.card"
              borderRadius="md"
              boxShadow="lg"
              maxH="200px"
              overflowY="auto"
              zIndex={1000}
            >
              {loading ? (
                <Box p={3} textAlign="center">
                  <Spinner size="sm" color="accent.default" />
                </Box>
              ) : (
                <VStack gap={0} align="stretch">
                  {suggestions.map((tag, index) => (
                    <HStack
                      key={tag.id}
                      p={2}
                      px={3}
                      cursor="pointer"
                      bg={selectedIndex === index ? 'bg.subtle' : 'transparent'}
                      _hover={{ bg: 'bg.subtle' }}
                      onClick={() => handleSubmit(tag.name)}
                      justify="space-between"
                    >
                      <Text fontSize="sm" fontWeight="medium">
                        {tag.name}
                      </Text>
                      <Badge colorPalette="accent" variant="subtle" fontSize="xs">
                        {tag.usageCount} {tag.usageCount === 1 ? 'use' : 'uses'}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>
          )}
        </Box>

        <Button
          size="sm"
          colorPalette="accent"
          onClick={() => handleSubmit()}
          disabled={!inputValue.trim() || submitting}
        >
          {submitting ? <Spinner size="sm" /> : <LuCheck />}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          <LuX />
        </Button>
      </HStack>

      <Text fontSize="xs" color="fg.muted" mt={1}>
        Press Enter to add, Esc to cancel, ↑↓ to navigate suggestions
      </Text>
    </Box>
  );
}
