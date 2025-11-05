import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  Stack,
  Typography,
  Menu,
  MenuItem,
  Checkbox,
  Alert,
  Sheet,
  Divider,
} from "@mui/joy";
import { Book } from "@/types/book";
import { BookCover } from "./BookCover";
import { ColumnConfig } from "@/hooks/useTableColumns";
import { devLog } from "@/utils/devLog";

export interface BooksTableProps {
  books: Book[];
  columns: ColumnConfig[];
  onToggleColumnVisibility: (columnId: string) => void;
  onReorderColumns: (columnId: string, newOrder: number) => void;
  onResetColumns: () => void;
  isLoading?: boolean;
  error?: string | null;
}

type SortDirection = "asc" | "desc" | null;

const SEARCHABLE_COLUMNS = ["title", "authors", "publisher", "tags"];

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

function getBookFieldValue(
  book: Book,
  fieldId: string,
): string | string[] | number | boolean | null {
  switch (fieldId) {
    case "title":
      return book.title;
    case "authors":
      return book.authors.map((a) => a.name);
    case "series":
      return book.series?.name || "";
    case "publisher":
      return book.publishers[0] || "";
    case "pubdate":
      return book.pubdate;
    case "tags":
      return book.tags.map((t) => t.name);
    case "isbn":
      return book.isbn;
    case "languages":
      return book.languages;
    case "formats":
      return book.formats;
    case "rating":
      return book.rating;
    default:
      return "";
  }
}

function formatCellValue(
  value: string | string[] | number | boolean | null,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function parseSearchQuery(query: string): Record<string, string[]> {
  const result: Record<string, string[]> = { _text: [] };
  const advancedPattern = /(\w+):(?:~?"([^"]+)"|([^\s]+))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = advancedPattern.exec(query)) !== null) {
    // Add text before this match to free text search
    if (match.index > lastIndex) {
      const textBefore = query.substring(lastIndex, match.index).trim();

      if (textBefore) {
        result._text.push(textBefore);
      }
    }

    const field = match[1];
    const value = match[2] || match[3];

    if (!result[field]) {
      result[field] = [];
    }

    result[field].push(value);

    lastIndex = advancedPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < query.length) {
    const remainingText = query.substring(lastIndex).trim();

    if (remainingText) {
      result._text.push(remainingText);
    }
  }

  return result;
}

function matchesSearch(book: Book, searchQuery: string): boolean {
  if (!searchQuery.trim()) {
    return true;
  }

  const parsedQuery = parseSearchQuery(normalizeText(searchQuery));

  // Check free text search
  if (parsedQuery._text.length > 0) {
    const freeTextMatches = parsedQuery._text.every((term) => {
      return SEARCHABLE_COLUMNS.some((col) => {
        const value = getBookFieldValue(book, col);
        const normalizedValue = normalizeText(formatCellValue(value));

        return normalizedValue.includes(term);
      });
    });

    if (!freeTextMatches) {
      return false;
    }
  }

  // Check field-specific searches
  for (const [field, terms] of Object.entries(parsedQuery)) {
    if (field === "_text") {
      continue;
    }

    const fieldValue = normalizeText(
      formatCellValue(getBookFieldValue(book, field)),
    );
    const allTermsMatch = terms.every((term) => fieldValue.includes(term));

    if (!allTermsMatch) {
      return false;
    }
  }

  return true;
}

export function BooksTable({
  books,
  columns,
  onToggleColumnVisibility,
  onResetColumns,
  isLoading = false,
  error = null,
}: BooksTableProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const visibleColumns = columns.filter((col) => col.visible);

  useEffect(() => {
    if (!columnMenuAnchor) return;

    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;

      if (
        columnMenuAnchor.contains(target) ||
        target.closest('[role="menu"]')
      ) {
        return;
      }

      handleColumnMenuClose();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [columnMenuAnchor]);

  const filteredBooks = useMemo(
    (): Book[] => books.filter((book) => matchesSearch(book, searchQuery)),
    [books, searchQuery],
  );

  const sortedBooks = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return filteredBooks;
    }

    return [...filteredBooks].sort((a, b) => {
      const aValue = getBookFieldValue(a, sortColumn);
      const bValue = getBookFieldValue(b, sortColumn);

      const aStr = formatCellValue(aValue).toLowerCase();
      const bStr = formatCellValue(bValue).toLowerCase();

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBooks, sortColumn, sortDirection]);

  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setColumnMenuAnchor(event.currentTarget);
  };

  const handleColumnMenuClose = (): void => {
    setColumnMenuAnchor(null);
  };

  const handleSort = (columnId: string): void => {
    if (columnId === "cover") return;

    if (sortColumn === columnId) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const handleMouseDown = useCallback(
    (columnId: string, e: React.MouseEvent<HTMLDivElement>): void => {
      devLog("Mouse down on column:", columnId);

      e.preventDefault();

      const startXPos = e.clientX;
      const startColWidth = columnWidths[columnId] ?? 100;

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        const diff = moveEvent.clientX - startXPos;
        const newWidth = Math.max(10, startColWidth + diff);

        devLog(
          "Resizing column:",
          columnId,
          "diff:",
          diff,
          "New width:",
          newWidth,
        );

        setColumnWidths((prev) => ({
          ...prev,
          [columnId]: newWidth,
        }));
      };

      const handleMouseUp = (): void => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [columnWidths],
  );

  const getColumnWidth = (columnId: string): number => {
    if (columnId === "cover") {
      return 100;
    }
    return columnWidths[columnId] ?? 300;
  };

  const getTotalTableWidth = (): number => {
    return visibleColumns.reduce(
      (total, col) => total + getColumnWidth(col.id),
      0,
    );
  };

  const renderCellContent = (book: Book, columnId: string): React.ReactNode => {
    if (columnId === "cover") {
      return <BookCover bookId={book.id} alt={`Cover for ${book.title}`} />;
    }

    const value = getBookFieldValue(book, columnId);

    return formatCellValue(value);
  };

  if (error) {
    return (
      <Alert data-testid="error-message" color="danger" variant="soft">
        Error: {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Typography data-testid="loading-state" level="body-md" sx={{ textAlign: "center", py: 3 }}>
        Loading books...
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* Search Bar */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "flex-end", flexShrink: 0 }}
      >
        <Input
          data-testid="books-search-input"
          placeholder="Search books... (use title:'search' for advanced search)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <Button
          data-testid="columns-menu-button"
          variant="outlined"
          color="neutral"
          onClick={handleColumnMenuOpen}
        >
          Columns
        </Button>
      </Stack>

      {/* Column Menu */}
      <Menu
        data-testid="columns-menu"
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={handleColumnMenuClose}
        keepMounted={false}
        sx={{
          zIndex: 1300,
        }}
      >
        {columns.map((col) => (
          <MenuItem
            key={col.id}
            onClick={() => onToggleColumnVisibility(col.id)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Checkbox
                data-testid={`column-checkbox-${col.id}`}
                checked={col.visible}
                onChange={() => onToggleColumnVisibility(col.id)}
                onClick={(e) => e.stopPropagation()}
              />

              <span>{col.label}</span>
            </Box>
          </MenuItem>
        ))}

        <Divider />

        <MenuItem data-testid="reset-columns-button" onClick={() => onResetColumns()}>
          Reset to Default
        </MenuItem>
      </Menu>

      {/* Table */}
      {filteredBooks.length === 0 ? (
        <Typography data-testid="empty-state" level="body-md" sx={{ textAlign: "center", py: 3 }}>
          No books found
        </Typography>
      ) : (
        <Box
          className="table-container"
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
            borderRadius: "md",
          }}
        >
          <Sheet
            component="table"
            variant="outlined"
            sx={{
              width: `${getTotalTableWidth()}px`,
              borderCollapse: "collapse",
              tableLayout: "fixed",
              "& thead": {
                backgroundColor: "var(--joy-palette-background-level1)",
                position: "sticky",
                top: 0,
                zIndex: 3,
              },
              "& th, & td": {
                padding: "12px 16px",
                textAlign: "left",
                borderBottom: "1px solid",
                borderRight: "1px solid",
                borderColor: "divider",
                height: "48px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
              "& th": {
                fontWeight: "bold",
                backgroundColor: "var(--joy-palette-background-level1)",
                position: "relative",
              },
              "& tbody tr:hover": {
                backgroundColor: "var(--joy-palette-background-level2)",
              },
              "& tr > *:first-of-type": {
                position: "sticky",
                left: 0,
                zIndex: 1,
                backgroundColor: "var(--joy-palette-background-surface)",
              },
              "& thead tr > *:first-of-type": {
                backgroundColor: "var(--joy-palette-background-level1)",
                zIndex: 4,
              },
            }}
          >
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    data-testid={`column-header-${col.id}`}
                    style={{
                      width: `${getColumnWidth(col.id)}px`,
                      maxWidth: `${getColumnWidth(col.id)}px`,
                      cursor: col.id !== "cover" ? "pointer" : "default",
                    }}
                    onClick={() => handleSort(col.id)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{col.label}</span>
                      {col.id !== "cover" && sortColumn === col.id && (
                        <span>
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </Box>
                    {col.id !== "cover" && (
                      <Box
                        className="resize-handle"
                        onMouseDown={(e) => handleMouseDown(col.id, e)}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedBooks.map((book) => (
                <tr key={book.id} data-testid={`book-row-${book.id}`}>
                  {visibleColumns.map((col) => (
                    <td
                      key={`${book.id}-${col.id}`}
                      style={{
                        maxWidth: `${getColumnWidth(col.id)}px`,
                      }}
                    >
                      {col.id === "cover" ? (
                        <span data-testid={`cover-skeleton-${book.id}`}>
                          {renderCellContent(book, col.id)}
                        </span>
                      ) : (
                        renderCellContent(book, col.id)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Sheet>
        </Box>
      )}

      {/* Results Info */}
      <Typography
        data-testid="book-count"
        level="body-sm"
        sx={{ textAlign: "right", color: "neutral", flexShrink: 0 }}
      >
        Showing {filteredBooks.length} of {books.length} books
      </Typography>
    </Box>
  );
}
