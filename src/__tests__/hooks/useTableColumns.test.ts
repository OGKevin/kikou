import { renderHook, act } from "@testing-library/react";
import { useTableColumns } from "@/hooks/useTableColumns";

describe("useTableColumns", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns default columns on first render", () => {
    const { result } = renderHook(() => useTableColumns());

    expect(result.current.columns).toHaveLength(11);
    expect(result.current.visibleColumns.length).toBeGreaterThan(0);
  });

  it("loads columns from localStorage if they exist", () => {
    const customColumns = [
      { id: "title", label: "Title", visible: false, order: 0 },
      { id: "authors", label: "Authors", visible: true, order: 1 },
    ];

    localStorage.setItem("kikou_table_columns", JSON.stringify(customColumns));

    const { result } = renderHook(() => useTableColumns());

    expect(result.current.columns).toEqual(customColumns);
  });

  it("toggles column visibility", () => {
    const { result } = renderHook(() => useTableColumns());

    const titleColumn = result.current.columns.find((c) => c.id === "title");
    const initialVisibility = titleColumn?.visible;

    act(() => {
      result.current.toggleColumnVisibility("title");
    });

    const updatedColumn = result.current.columns.find((c) => c.id === "title");
    expect(updatedColumn?.visible).toBe(!initialVisibility);
  });

  it("saves columns to localStorage when toggling visibility", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.toggleColumnVisibility("isbn");
    });

    const saved = localStorage.getItem("kikou_table_columns");
    expect(saved).toBeTruthy();

    const parsedColumns = JSON.parse(saved!);
    const isbnColumn = parsedColumns.find((c: any) => c.id === "isbn");
    expect(isbnColumn?.visible).toBe(true);
  });

  it("filters visible columns correctly", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.toggleColumnVisibility("isbn");
      result.current.toggleColumnVisibility("languages");
    });

    const visibleIds = result.current.visibleColumns.map((c) => c.id);
    expect(visibleIds).toContain("isbn");
    expect(visibleIds).toContain("languages");
    expect(visibleIds).not.toContain("formats");
  });

  it("reorders columns", () => {
    const { result } = renderHook(() => useTableColumns());

    const initialOrder = result.current.columns.map((c) => c.id);

    act(() => {
      result.current.reorderColumns("isbn", 0);
    });

    const newOrder = result.current.columns.map((c) => c.id);
    expect(newOrder[0]).toBe("isbn");
    expect(newOrder).not.toEqual(initialOrder);
  });

  it("recalculates order numbers after reordering", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.reorderColumns("title", 5);
    });

    const orders = result.current.columns.map((c) => c.order);
    const expectedOrders = Array.from({ length: orders.length }, (_, i) => i);
    expect(orders).toEqual(expectedOrders);
  });

  it("persists reordered columns to localStorage", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.reorderColumns("isbn", 0);
    });

    const saved = localStorage.getItem("kikou_table_columns");
    const parsedColumns = JSON.parse(saved!);
    expect(parsedColumns[0].id).toBe("isbn");
  });

  it("resets columns to defaults", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.toggleColumnVisibility("title");
      result.current.toggleColumnVisibility("isbn");
      result.current.reorderColumns("authors", 0);
    });

    act(() => {
      result.current.resetColumns();
    });

    // After reset, columns should be back to defaults
    expect(result.current.columns[0].id).toBe("cover");
    expect(result.current.columns[0].order).toBe(0);

    // Title should be visible again (default state)
    const titleColumn = result.current.columns.find((c) => c.id === "title");
    expect(titleColumn?.visible).toBe(true);
    expect(titleColumn?.order).toBe(1);

    // ISBN should be hidden again (default state)
    const isbnColumn = result.current.columns.find((c) => c.id === "isbn");
    expect(isbnColumn?.visible).toBe(false);
    expect(isbnColumn?.order).toBe(7);
  });

  it("handles invalid localStorage data gracefully", () => {
    localStorage.setItem("kikou_table_columns", "invalid json");

    const { result } = renderHook(() => useTableColumns());

    expect(result.current.columns.length).toBeGreaterThan(0);
    expect(result.current.columns[0].id).toBe("cover");
  });

  it("maintains visible column order", () => {
    const { result } = renderHook(() => useTableColumns());

    act(() => {
      result.current.toggleColumnVisibility("isbn");
      result.current.toggleColumnVisibility("languages");
    });

    const visibleOrders = result.current.visibleColumns.map((c) => c.order);
    const isSorted = visibleOrders.every(
      (order, i) => i === 0 || order > visibleOrders[i - 1],
    );
    expect(isSorted).toBe(true);
  });

  it("does not modify column if reordering with invalid id", () => {
    const { result } = renderHook(() => useTableColumns());

    const initialColumns = [...result.current.columns];

    act(() => {
      result.current.reorderColumns("nonexistent", 0);
    });

    expect(result.current.columns).toEqual(initialColumns);
  });
});
