---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript Typing Standards

Ensure strict typing across all TypeScript files to catch errors at compile time and improve code maintainability.

## Core Principles

- **No implicit `any`**: Never use implicit `any` types. Always explicitly declare types or infer them correctly.
- **Explicit return types**: All functions and methods must have explicit return type annotations.
- **Explicit parameter types**: All function parameters must be explicitly typed.
- **No `any` or `unknown`**: Avoid `any` and `unknown` types unless there is an explicit, documented reason.
- **Strict mode**: Ensure `strict: true` is enabled in `tsconfig.json`.

## Guidelines

### Function Declarations

```typescript
// Good - Explicit parameter and return types
function getBookTitle(book: Book): string {
  return book.title;
}

// Bad - Implicit any
function getBookTitle(book) {
  return book.title;
}

// Bad - No return type
function getBookTitle(book: Book) {
  return book.title;
}
```

### Object/Interface Definitions

```typescript
// Good - Explicit typed object
interface SearchQuery {
  field: string;
  value: string;
  isRegex?: boolean;
}

// Bad - Implicit any
const query = {
  field: "title",
  value: "test",
};
```

### useState and State Management

```typescript
// Good - Explicit type parameter
const [books, setBooks] = useState<Book[]>([]);
const [sortColumn, setSortColumn] = useState<string | null>(null);

// Bad - Implicit any
const [books, setBooks] = useState([]);
```

### Event Handlers

```typescript
// Good - Explicit event type
const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
  // Implementation
};

// Bad - Implicit any
const handleClick = (event) => {
  // Implementation
};
```

### Callback Functions

```typescript
// Good - Explicit parameter and return types
const handleToggle = (columnId: string): void => {
  onToggleColumnVisibility(columnId);
};

// Bad - No types
const handleToggle = (columnId) => {
  onToggleColumnVisibility(columnId);
};
```

### useMemo and useCallback

```typescript
// Good - Explicit return type
const filteredBooks = useMemo(
  (): Book[] => books.filter((book) => matchesSearch(book, query)),
  [books, query],
);

const handleSort = useCallback((columnId: string): void => {
  // Implementation
}, []);

// Bad - No return type
const filteredBooks = useMemo(
  () => books.filter((book) => matchesSearch(book, query)),
  [books, query],
);
```

### Union and Optional Types

```typescript
// Good - Explicit union type
type SortDirection = "asc" | "desc" | null;
const [sortDirection, setSortDirection] = useState<SortDirection>(null);

// Good - Optional with explicit type
const error: string | null = null;
const handleError = (message?: string): void => {};

// Bad - Implicit any in optional
const handleError = (message?) => {};
```

### Generic Types

```typescript
// Good - Explicit generic parameter
function parseQuery<T>(data: string): Record<string, T[]> {
  // Implementation
}

// Bad - Missing generic parameter
function parseQuery(data: string) {
  // Implementation
}
```

### Array Types

```typescript
// Good - Explicit array type
const books: Book[] = [];
const tags: string[] = [];

// Also good - Alternative syntax
const books: Array<Book> = [];

// Bad - Implicit any
const books = [];
```

### Ref Types

```typescript
// Good - Explicit ref type
const resizingColumn = useRef<string | null>(null);
const startX = useRef<number>(0);

// Bad - Implicit any
const resizingColumn = useRef(null);
```

## When `any` or `unknown` is Acceptable

Only use `any` or `unknown` when:

1. Working with truly dynamic external data (e.g., JSON from API without schema)
2. Integrating with untyped third-party libraries
3. There is an explicit code comment explaining why
4. The situation is temporary and there is a task to fix it

**Always document with a comment:**

```typescript
// TODO: Replace with proper type once API schema is defined
const data: any = response.data;

// External library lacks TypeScript support
const result: unknown = externalLibrary.process(input);
```

## Verification

- Run `pnpm build` to verify TypeScript compilation
- Run `pnpm lint` to check for type issues
- Ensure no TypeScript errors appear in the editor (red squiggles)
- Use `tsc --noEmit` to do a full type check without emitting files
