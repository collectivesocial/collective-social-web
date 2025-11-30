# Copilot Instructions - Collective Social Web

## Project Overview
React 19 + TypeScript frontend for Collective Social, a book/media tracking and review platform with ATProto/Bluesky integration.

## Technology Stack
- **Framework**: React 19.0.0 with TypeScript
- **Build Tool**: Vite 6.0.1
- **UI Library**: Chakra UI v3.30.0 (latest major version)
- **Routing**: React Router DOM v7.1.1
- **Icons**: Lucide React (via `react-icons/lu`)
- **Styling**: Emotion (CSS-in-JS via Chakra UI)

## Project Structure
```
src/
├── App.tsx                    # Main app component with routing
├── main.tsx                   # Entry point, Chakra provider setup
├── components/
│   ├── CollectionCard.tsx     # Display collection with keyboard accessibility
│   ├── EmptyState.tsx         # Empty state component
│   ├── ItemModal.tsx          # Modal for add/edit media items
│   ├── MediaItemCard.tsx      # Display individual media item
│   ├── MediaSearch.tsx        # Search for books/media
│   ├── RatingDistribution.tsx # Rating breakdown display (expandable)
│   ├── ShareButton.tsx        # Generate/copy share links
│   ├── StarRating.tsx         # Display-only star rating
│   ├── StarRatingSelector.tsx # Interactive star rating input
│   ├── UserProfileView.tsx    # User profile with collections
│   └── ui/                    # Chakra UI components
├── pages/
│   ├── AdminPage.tsx          # Admin dashboard
│   ├── CollectionPage.tsx     # Individual collection view
│   ├── FeedPage.tsx           # Activity feed
│   ├── HomePage.tsx           # Landing/collections page
│   ├── ItemDetailsPage.tsx    # Media item details + reviews
│   ├── ProfilePage.tsx        # Current user profile
│   ├── ShareRedirectPage.tsx  # Handle share link redirects
│   └── UserProfilePage.tsx    # Other users' profiles
└── utils/
    └── textUtils.tsx          # Text parsing (mentions, hashtags, URLs)
```

## Chakra UI v3 - Important Changes from v2

### Breaking Changes to Know
1. **Theme System**: Use `createSystem()` instead of `extendTheme()`
2. **Provider**: `<Provider>` replaces `<ChakraProvider>`
3. **Props**: `colorPalette` replaces `colorScheme`
4. **Components**:
   - `Modal` → `Dialog`
   - `Collapse` → `Collapsible`
   - `Divider` → `Separator`
   - `RangeSlider` → `Slider` with range support
   - `CircularProgress` → `ProgressCircle`
5. **Pseudo Props**: Use native CSS syntax
   - `_hover` → `_hover` (still works but use native when possible)
   - `_focus` → `_focus`
6. **Boolean Props**: Follow native naming
   - `isOpen` → `open` (for dialogs)
   - `isDisabled` → `disabled`
   - `isReadOnly` → `readOnly`

### Common Chakra Patterns in This Project
```tsx
// Box with styling
<Box bg="bg.subtle" borderRadius="lg" p={4}>
  Content
</Box>

// Flex layouts
<Flex direction="row" gap={4} align="center" justify="space-between">
  Items
</Flex>

// VStack/HStack (use Flex or Stack)
<VStack gap={4} align="stretch">
  Items
</VStack>

// Button with color palette
<Button colorPalette="teal" variant="solid">
  Click Me
</Button>

// Responsive props
<Box
  fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
  p={{ base: 2, md: 4 }}
>
  Content
</Box>
```

### Chakra UI Semantic Tokens
- Colors: `bg.subtle`, `bg.muted`, `fg.muted`, `border`, `teal.500`, etc.
- Use semantic tokens for better theme support
- Primary color palette: `teal` (500, 600, 700, etc.)

## Component Patterns

### Star Rating System
Two components work together:

#### StarRating (Display Only)
```tsx
<StarRating rating={4.5} size="1.5rem" color="teal.500" />
```
- Shows filled/half/empty stars
- Uses LuStar and LuStarHalf from react-icons/lu
- Props: `rating: number`, `size?: string`, `color?: string`

#### StarRatingSelector (Interactive)
```tsx
<StarRatingSelector
  rating={rating}
  onChange={(newRating) => setRating(newRating)}
  size="24px"
/>
```
- Mouse: Click left half for 0.5, right half for full star
- Keyboard: Arrow keys to adjust (0.5-5 in 0.5 increments)
- Accessible: `role="radiogroup"`, keyboard navigation
- Single tab stop (container), individual stars are `tabIndex={-1}`

### Rating Distribution Display
```tsx
<RatingDistributionDisplay
  distribution={{
    rating5: 20, rating4_5: 13, rating4: 7,
    rating3_5: 5, rating3: 3, rating2_5: 1,
    rating2: 0, rating1_5: 0, rating1: 0,
    rating0_5: 0, rating0: 0
  }}
  totalRatings={49}
/>
```
- Clickable to expand/collapse
- Shows horizontal bar chart with percentages
- Keyboard accessible (Enter/Space to toggle)

### Text Utils - Link Parsing
```tsx
import { renderTextWithLinks } from '../utils/textUtils';

// In component
<Text>{renderTextWithLinks(bioText)}</Text>
```
- Converts `@handle.bsky.social` → Bluesky profile link
- Converts `#hashtag` → Bluesky search link
- Converts URLs → clickable external links
- Returns array of text and React elements

## API Integration

### Base URL
Configured in `App.tsx`, passed down as prop:
```tsx
const apiUrl = 'http://localhost:3000';
```

### Common API Patterns
```typescript
// Authenticated requests (include credentials)
const response = await fetch(`${apiUrl}/endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important for session cookies
  body: JSON.stringify(data)
});

// Error handling
if (!response.ok) {
  throw new Error('Request failed');
}
const data = await response.json();
```

### Key Endpoints Used
- `GET /users/me` - Current user info
- `GET /collections/public/:did` - User's public collections
- `POST /collections/items` - Add/update item in collection
- `DELETE /collections/items/:rkey` - Delete item
- `GET /media/:id` - Media item details (includes `ratingDistribution`)
- `GET /media/:id/reviews` - Reviews for media item
- `GET /media/search` - Search books/media
- `POST /share/create` - Create share link

## TypeScript Interfaces

### Media Item
```typescript
interface RatingDistribution {
  rating0: number;
  rating0_5: number;
  rating1: number;
  rating1_5: number;
  rating2: number;
  rating2_5: number;
  rating3: number;
  rating3_5: number;
  rating4: number;
  rating4_5: number;
  rating5: number;
}

interface MediaItem {
  id: number;
  mediaType: string;
  title: string;
  creator: string | null;
  isbn: string | null;
  coverImage: string | null;
  description: string | null;
  publishedYear: number | null;
  totalRatings: number;
  totalReviews: number;
  totalSaves: number;
  averageRating: number | null;
  ratingDistribution?: RatingDistribution;
}
```

### List Item (Collection Item)
```typescript
interface ListItem {
  uri: string;
  cid: string;
  title: string;
  creator: string | null;
  mediaType: string;
  mediaItemId: number | null;
  status: 'want' | 'in-progress' | 'completed' | null;
  rating: number | null;
  review: string | null;
  notes: string | null;
  recommendations: Recommendation[];
  createdAt: string;
  mediaItem?: MediaItem;
}
```

### User Profile
```typescript
interface UserProfile {
  did: string;
  handle: string;
  displayName: string;
  description: string;
  avatar: string;
  followerCount: number;
  followsCount: number;
  postsCount: number;
  collectionCount: number;  // Added in recent updates
  reviewCount: number;      // Added in recent updates
}
```

## Routing

### Route Structure
```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/profile" element={<ProfilePage />} />
  <Route path="/profile/:did" element={<UserProfilePage />} />
  <Route path="/collections/:collectionId" element={<CollectionPage />} />
  <Route path="/items/:itemId" element={<ItemDetailsPage />} />
  <Route path="/feed" element={<FeedPage />} />
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/s/:shortCode" element={<ShareRedirectPage />} />
</Routes>
```

### Navigation
```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/path');           // Navigate to path
navigate(-1);               // Go back
navigate(`/items/${id}`);   // Dynamic route
```

## Accessibility Patterns

### Keyboard Navigation
```tsx
// Clickable cards
<Box
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  _focusVisible={{ outline: '2px solid', outlineColor: 'teal.500' }}
>
  Content
</Box>
```

### Focus Management
- Use `_focusVisible` for keyboard-only focus indicators
- Ensure all interactive elements are keyboard accessible
- Use semantic HTML (`<button>`, `<a>`) when possible

## State Management

### Local State with useState
```tsx
const [items, setItems] = useState<ListItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Effect Hooks
```tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch(`${apiUrl}/endpoint`);
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependency]); // Add dependencies
```

## Common Patterns

### Loading States
```tsx
if (loading) {
  return (
    <Center py={8}>
      <VStack gap={4}>
        <Spinner size="xl" color="teal.500" />
        <Text color="fg.muted">Loading...</Text>
      </VStack>
    </Center>
  );
}
```

### Error States
```tsx
if (error) {
  return (
    <Center py={8}>
      <Text color="red.500">Error: {error}</Text>
    </Center>
  );
}
```

### Empty States
```tsx
import { EmptyState } from '../components/EmptyState';

<EmptyState
  title="No items found"
  description="Add your first item to get started"
  icon={<LuBookOpen size={48} />}
/>
```

### Modal Dialogs (Chakra v3)
```tsx
import { DialogRoot, DialogContent, DialogHeader, DialogBody } from '@chakra-ui/react';

<DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
  <DialogContent>
    <DialogHeader>Title</DialogHeader>
    <DialogBody>Content</DialogBody>
  </DialogContent>
</DialogRoot>
```

## Development Workflow

### Running the App
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Environment Setup
- No `.env` file needed for development (API URL hardcoded)
- Backend must be running on `http://localhost:3000`
- Hot reload enabled via Vite

## Styling Guidelines

### Responsive Design
Use Chakra's responsive props with breakpoints:
- `base`: 0px and up (mobile)
- `sm`: 480px and up
- `md`: 768px and up
- `lg`: 992px and up
- `xl`: 1280px and up

```tsx
<Box
  fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
  p={{ base: 2, md: 4, lg: 6 }}
  direction={{ base: 'column', md: 'row' }}
>
```

### Color Scheme
- Primary: Teal (`teal.500`, `teal.600`, etc.)
- Backgrounds: `bg.subtle`, `bg.muted`
- Text: Default, `fg.muted` for secondary
- Borders: `border` semantic token

### Spacing
Use Chakra's gap/padding scale:
- Small: `2`, `3`, `4`
- Medium: `6`, `8`
- Large: `10`, `12`

## Important Gotchas

1. **Credentials**: Always include `credentials: 'include'` in fetch requests for authentication
2. **Chakra v3**: Many components have new names (Modal → Dialog, etc.)
3. **Boolean Props**: Chakra v3 uses native naming (open vs isOpen)
4. **Rating Range**: 0-5 in 0.5 increments (11 possible values)
5. **Rating Distribution**: Keys use underscores (`rating0_5` not `rating0.5`)
6. **Navigation**: Use `useNavigate()` hook, not `history.push()`
7. **Responsive**: Always consider mobile-first design with responsive props
8. **Icons**: Import from `react-icons/lu` (Lucide icons)
9. **Star Rating**: Use existing components, don't recreate with emojis
10. **Text Links**: Use `renderTextWithLinks` utility for bio/description text

## Testing

Currently no automated tests. Manual testing via:
- Browser dev tools
- React DevTools
- Network tab for API calls

## Performance Considerations

- Use `React.memo()` for expensive components
- Lazy load routes if app grows: `React.lazy(() => import('./Page'))`
- Optimize images (cover images from external sources)
- Paginate long lists (reviews, collections)
- Debounce search inputs

## Future Enhancements to Consider

- Add loading skeletons instead of spinners
- Implement infinite scroll for long lists
- Add optimistic UI updates
- Cache API responses (React Query/SWR)
- Add error boundaries
- Implement toast notifications for actions
- Add animation/transitions for better UX
