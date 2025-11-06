import { useState, useEffect, useCallback } from "react";

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

const TABLE_COLUMNS_KEY = "kikou_table_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "cover", label: "Cover", visible: true, order: 0 },
  { id: "title", label: "Title", visible: true, order: 1 },
  { id: "authors", label: "Authors", visible: true, order: 2 },
  { id: "series", label: "Series", visible: true, order: 3 },
  { id: "publisher", label: "Publisher", visible: true, order: 4 },
  { id: "pubdate", label: "Published", visible: true, order: 5 },
  { id: "tags", label: "Tags", visible: true, order: 6 },
  { id: "isbn", label: "ISBN", visible: false, order: 7 },
  { id: "languages", label: "Languages", visible: false, order: 8 },
  { id: "formats", label: "Formats", visible: false, order: 9 },
  { id: "rating", label: "Rating", visible: false, order: 10 },
];

export interface UseTableColumnsReturn {
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  toggleColumnVisibility: (columnId: string) => void;
  reorderColumns: (columnId: string, newOrder: number) => void;
  resetColumns: () => void;
}

export function useTableColumns(): UseTableColumnsReturn {
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  // Load columns from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(TABLE_COLUMNS_KEY);

    if (saved) {
      try {
        const parsedColumns = JSON.parse(saved) as ColumnConfig[];

        setColumns(parsedColumns);
      } catch {
        // If parsing fails, use defaults
        setColumns(DEFAULT_COLUMNS);
      }
    }
  }, []);

  // Save columns to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(TABLE_COLUMNS_KEY, JSON.stringify(columns));
  }, [columns]);

  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col,
      ),
    );
  }, []);

  const reorderColumns = useCallback((columnId: string, newOrder: number) => {
    setColumns((prev) => {
      const updated = [...prev];
      const columnIndex = updated.findIndex((col) => col.id === columnId);

      if (columnIndex === -1) {
        return prev;
      }

      const column = updated[columnIndex];

      updated.splice(columnIndex, 1);
      updated.splice(newOrder, 0, column);

      // Recalculate all orders
      return updated.map((col, index) => ({ ...col, order: index }));
    });
  }, []);

  const resetColumns = useCallback(() => {
    setColumns(DEFAULT_COLUMNS);
    localStorage.removeItem(TABLE_COLUMNS_KEY);
  }, []);

  const visibleColumns = columns.filter((col) => col.visible);

  return {
    columns,
    visibleColumns,
    toggleColumnVisibility,
    reorderColumns,
    resetColumns,
  };
}
