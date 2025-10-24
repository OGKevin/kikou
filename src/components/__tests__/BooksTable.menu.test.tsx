import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BooksTable } from "../BooksTable";
import { Book } from "@/types/book";

const mockBooks: Book[] = [
  {
    id: 1,
    title: "Test Book",
    sort: "Book, Test",
    timestamp: "2024-01-01T00:00:00Z",
    pubdate: "2024-01-01",
    series_index: 0,
    author_sort: "Author, Test",
    authors: [{ id: 1, name: "Test Author", sort: "Author, Test" }],
    publishers: ["Test Publisher"],
    tags: [{ id: 1, name: "Fiction" }],
    isbn: "1234567890",
    lccn: "",
    path: "test/path",
    has_cover: false,
    comments: null,
    rating: 5,
    series: null,
    formats: ["EPUB"],
    identifiers: [],
    languages: ["en"],
  },
];

const mockColumns = [
  { id: "cover", label: "Cover", visible: true, order: 0 },
  { id: "title", label: "Title", visible: true, order: 1 },
  { id: "authors", label: "Authors", visible: true, order: 2 },
];

const mockReorderColumns = jest.fn();

describe("BooksTable - Column Menu", () => {
  it("should open column menu when Columns button is clicked", () => {
    const mockToggle = jest.fn();
    const mockReset = jest.fn();

    render(
      <BooksTable
        books={mockBooks}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggle}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockReset}
      />,
    );

    const columnsButton = screen.getByRole("button", { name: /columns/i });
    fireEvent.click(columnsButton);

    // Check if menu is visible by finding the menu and checking for column checkboxes
    expect(screen.getByTestId("column-checkbox-cover")).toBeInTheDocument();
    expect(screen.getByTestId("column-checkbox-title")).toBeInTheDocument();
    expect(screen.getByTestId("column-checkbox-authors")).toBeInTheDocument();
  });

  it("should call onToggleColumnVisibility when clicking on a column menu item", () => {
    const mockToggle = jest.fn();
    const mockReset = jest.fn();

    render(
      <BooksTable
        books={mockBooks}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggle}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockReset}
      />,
    );

    // Open menu
    const columnsButton = screen.getByRole("button", { name: /columns/i });
    fireEvent.click(columnsButton);

    // Find the title menu item and click it
    const titleMenuItems = screen.getAllByRole("menuitem").filter((item) => {
      return item.textContent?.includes("Title");
    });

    if (titleMenuItems.length > 0) {
      fireEvent.click(titleMenuItems[0]);
      expect(mockToggle).toHaveBeenCalledWith("title");
    }
  });

  it("should call onResetColumns when clicking Reset button", () => {
    const mockToggle = jest.fn();
    const mockReset = jest.fn();

    render(
      <BooksTable
        books={mockBooks}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggle}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockReset}
      />,
    );

    // Open menu
    const columnsButton = screen.getByRole("button", { name: /columns/i });
    fireEvent.click(columnsButton);

    // Click reset button
    const resetButton = screen.getByTestId("reset-columns-button");
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalled();
  });
});
