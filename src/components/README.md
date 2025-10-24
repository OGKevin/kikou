# Library UI Components

This directory contains reusable React components for the Calibre library management interface.

## Components

### BooksTable

Displays a searchable, filterable table of books with customizable columns.

**Features:**
- Dynamic column visibility and reordering
- Advanced search with field-specific queries (e.g., `title:"search term"`)
- Free-text search across multiple columns
- Sticky first column for horizontal scrolling
- Book count display
- Empty state handling
- Error display
- Loading state

**Props:**
```typescript
interface BooksTableProps {
  books: Book[];
  columns: ColumnConfig[];
  onToggleColumnVisibility: (columnId: string) => void;
  onReorderColumns: (columnId: string, newOrder: number) => void;
  onResetColumns: () => void;
  isLoading?: boolean;
  error?: string | null;
}
```

**Search Syntax:**
- Free text: `adventure` - searches across all text columns
- Field specific: `title:"The Hobbit"` - searches only title field
- Multiple terms: `title:"Hobbit" author:"Tolkien"` - must match all terms
- Case insensitive and trimmed automatically

**Example:**
```tsx
import { BooksTable } from "@/components/BooksTable";

<BooksTable
  books={books}
  columns={columns}
  onToggleColumnVisibility={toggleColumnVisibility}
  onReorderColumns={reorderColumns}
  onResetColumns={resetColumns}
  isLoading={false}
  error={null}
/>
```

### BookCoverSkeleton

Displays a loading skeleton for book covers.

**Features:**
- Wave animation
- Customizable width and height
- Rounded corners
- Centered display

**Props:**
```typescript
interface BookCoverSkeletonProps {
  width?: number | string;
  height?: number | string;
}
```

**Example:**
```tsx
import { BookCoverSkeleton } from "@/components/BookCoverSkeleton";

<BookCoverSkeleton width={60} height={90} />
```

### OpenLibraryDialog

Modal dialog for selecting and opening a Calibre library.

**Features:**
- File browser integration using Tauri
- Path validation
- Error handling and display
- Loading state
- Cancel and confirm actions
- Info alert about requirements

**Props:**
```typescript
interface OpenLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onLibrarySelected: (path: string) => Promise<void>;
  isLoading?: boolean;
}
```

**Example:**
```tsx
import { OpenLibraryDialog } from "@/components/OpenLibraryDialog";

const [dialogOpen, setDialogOpen] = useState(false);

<OpenLibraryDialog
  open={dialogOpen}
  onClose={() => setDialogOpen(false)}
  onLibrarySelected={handleLibrarySelected}
  isLoading={false}
/>
```

## Hooks

### useLibrary

Manages library state and operations including opening libraries and loading books.

**Returns:**
```typescript
interface UseLibraryReturn {
  books: Book[];
  isLoading: boolean;
  error: string | null;
  libraryPath: string | null;
  openLibrary: (path: string) => Promise<void>;
  loadBooks: () => Promise<void>;
  isLibraryOpen: boolean;
}
```

**Features:**
- Automatic localStorage persistence
- Auto-loads saved library on mount
- Auto-loads books after opening library
- Error handling and recovery
- Loading state management

**Example:**
```tsx
import { useLibrary } from "@/hooks/useLibrary";

const {
  books,
  isLoading,
  error,
  libraryPath,
  openLibrary,
  loadBooks,
  isLibraryOpen,
} = useLibrary();
```

### useTableColumns

Manages table column visibility and ordering with localStorage persistence.

**Returns:**
```typescript
interface UseTableColumnsReturn {
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  toggleColumnVisibility: (columnId: string) => void;
  reorderColumns: (columnId: string, newOrder: number) => void;
  resetColumns: () => void;
}
```

**Features:**
- localStorage persistence
- Default column configuration
- Toggle visibility
- Reorder columns
- Reset to defaults
- Filter visible columns

**Default Columns:**
- cover (visible)
- title (visible)
- authors (visible)
- series (visible)
- publisher (visible)
- pubdate (visible)
- tags (visible)
- isbn (hidden)
- languages (hidden)
- formats (hidden)
- rating (hidden)

**Example:**
```tsx
import { useTableColumns } from "@/hooks/useTableColumns";

const {
  columns,
  visibleColumns,
  toggleColumnVisibility,
  reorderColumns,
  resetColumns,
} = useTableColumns();
```

## Data Types

### Book

```typescript
interface Book {
  id: number;
  title: string;
  sort: string;
  timestamp: string;
  pubdate: string;
  series_index: number;
  author_sort: string;
  isbn: string;
  lccn: string;
  path: string;
  has_cover: boolean;
  authors: Author[];
  publishers: string[];
  tags: Tag[];
  series: Series | null;
  comments: string | null;
  rating: number | null;
  formats: string[];
  identifiers: Identifier[];
  languages: string[];
}
```

### ColumnConfig

```typescript
interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}
```

## Usage Example

Complete example of using all components together:

```tsx
import { useLibrary } from "@/hooks/useLibrary";
import { useTableColumns } from "@/hooks/useTableColumns";
import { BooksTable } from "@/components/BooksTable";
import { OpenLibraryDialog } from "@/components/OpenLibraryDialog";
import { useState } from "react";

export function LibraryPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const {
    books,
    isLoading,
    error,
    libraryPath,
    openLibrary,
    isLibraryOpen,
  } = useLibrary();

  const {
    columns,
    toggleColumnVisibility,
    reorderColumns,
    resetColumns,
  } = useTableColumns();

  if (!isLibraryOpen) {
    return (
      <>
        <button onClick={() => setDialogOpen(true)}>
          Open Library
        </button>
        
        <OpenLibraryDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onLibrarySelected={openLibrary}
        />
      </>
    );
  }

  return (
    <>
      <h1>Library: {libraryPath}</h1>
      
      <BooksTable
        books={books}
        columns={columns}
        onToggleColumnVisibility={toggleColumnVisibility}
        onReorderColumns={reorderColumns}
        onResetColumns={resetColumns}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
```

## Testing

All components have comprehensive test coverage. Run tests with:

```bash
pnpm test
```

Test files are located in `src/__tests__/`:
- `components/BooksTable.test.tsx` - BooksTable component tests
- `components/OpenLibraryDialog.test.tsx` - OpenLibraryDialog component tests
- `hooks/useLibrary.test.ts` - useLibrary hook tests
- `hooks/useTableColumns.test.ts` - useTableColumns hook tests

## localStorage Keys

- `kikou_library_path` - Stores the currently open library path
- `kikou_table_columns` - Stores column visibility and order configuration

## Notes

- All components use Joy UI for consistent styling
- Components are fully typed with TypeScript
- Search is performed client-side for better responsiveness
- Book covers are currently placeholders with skeleton loaders
- Column ordering updates are persisted immediately to localStorage