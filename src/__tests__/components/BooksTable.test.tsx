import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BooksTable } from "@/components/BooksTable";
import { Book } from "@/types/book";
import { ColumnConfig } from "@/hooks/useTableColumns";
import { renderWithProviders } from "@/test-utils/testUtils";

const mockBook: Book = {
  id: 1,
  title: "Test Book",
  pubdate: "2024-01-01T00:00:00Z",
  isbn: "123-456-789",
  authors: [{ id: 1, name: "Test Author", sort: "Author, Test" }],
  publishers: ["Test Publisher"],
  tags: [
    { id: 1, name: "Fiction" },
    { id: 2, name: "Adventure" },
  ],
  series: { id: 1, name: "Test Series" },
  rating: 4,
  formats: ["EPUB", "PDF"],
  languages: ["en", "es"],
};

const mockColumns: ColumnConfig[] = [
  { id: "cover", label: "Cover", visible: true, order: 0 },
  { id: "title", label: "Title", visible: true, order: 1 },
  { id: "authors", label: "Authors", visible: true, order: 2 },
  { id: "tags", label: "Tags", visible: true, order: 3 },
  { id: "isbn", label: "ISBN", visible: false, order: 4 },
];

const mockBook2 = { ...mockBook, id: 2, title: "Another Book" };
const mockBook3 = { ...mockBook, id: 3, title: "Different Title" };
const mockBookTagsFormatted = mockBook.tags.map((t) => t.name).join(", ");

describe("BooksTable", () => {
  const mockToggleColumnVisibility = jest.fn();
  const mockReorderColumns = jest.fn();
  const mockResetColumns = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders books in a table", () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    expect(screen.getByTestId("book-row-1")).toBeInTheDocument();
    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(mockBook.authors[0].name)).toBeInTheDocument();
  });

  it("displays only visible columns", () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    expect(screen.getByTestId("column-header-title")).toBeInTheDocument();
    expect(screen.getByTestId("column-header-authors")).toBeInTheDocument();
    expect(screen.queryByTestId("column-header-isbn")).not.toBeInTheDocument();
  });

  it("filters books by search query", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook, mockBook2]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const searchInput = screen.getByTestId("books-search-input") as HTMLInputElement;
    await userEvent.type(searchInput, "Another");

    expect(screen.getByText(mockBook2.title)).toBeInTheDocument();
    expect(screen.queryByText(mockBook.title)).not.toBeInTheDocument();
  });

  it("shows all books when search query is empty", () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook, mockBook2]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.getByText(mockBook2.title)).toBeInTheDocument();
  });

  it("supports advanced field-specific search", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook, mockBook3]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const searchInput = screen.getByTestId("books-search-input") as HTMLInputElement;
    await userEvent.type(searchInput, `title:"${mockBook.title}"`);

    expect(screen.getByText(mockBook.title)).toBeInTheDocument();
    expect(screen.queryByText(mockBook3.title)).not.toBeInTheDocument();
  });

  it("opens column menu when Columns button is clicked", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const columnsButton = screen.getByTestId("columns-menu-button");
    await userEvent.click(columnsButton);

    expect(screen.getByTestId("columns-menu")).toBeInTheDocument();
  });

  it("toggles column visibility from menu", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const columnsButton = screen.getByTestId("columns-menu-button");
    await userEvent.click(columnsButton);

    // Find the ISBN label and click it (this will trigger the MenuItem click)
    const isbnLabel = await screen.findByText("ISBN");
    await userEvent.click(isbnLabel);

    expect(mockToggleColumnVisibility).toHaveBeenCalledWith("isbn");
  });

  it("calls onResetColumns when reset button is clicked", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const columnsButton = screen.getByTestId("columns-menu-button");
    await userEvent.click(columnsButton);

    const resetButton = screen.getByTestId("reset-columns-button");
    await userEvent.click(resetButton);

    expect(mockResetColumns).toHaveBeenCalled();
  });

  it("displays empty state when no books match search", async () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const searchInput = screen.getByTestId("books-search-input") as HTMLInputElement;
    await userEvent.type(searchInput, "NonexistentBook");

    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
  });

  it("displays error when error prop is provided", () => {
    const errorMessage = "Test error message";
    renderWithProviders(
      <BooksTable
        books={[]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
        error={errorMessage}
      />,
    );

    expect(screen.getByTestId("error-message")).toHaveTextContent(errorMessage);
  });

  it("displays loading message when isLoading is true", () => {
    renderWithProviders(
      <BooksTable
        books={[]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
        isLoading={true}
      />,
    );

    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
  });

  it("displays book count at the bottom", () => {
    const books = [mockBook, { ...mockBook, id: 2 }];
    renderWithProviders(
      <BooksTable
        books={books}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    const bookCountElement = screen.getByTestId("book-count");
    expect(bookCountElement).toHaveTextContent(`Showing ${books.length} of ${books.length} books`);
  });

  it("formats array values with comma separation", () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    expect(screen.getByText(mockBookTagsFormatted)).toBeInTheDocument();
  });

  it("renders cover for cover column", () => {
    renderWithProviders(
      <BooksTable
        books={[mockBook]}
        columns={mockColumns}
        onToggleColumnVisibility={mockToggleColumnVisibility}
        onReorderColumns={mockReorderColumns}
        onResetColumns={mockResetColumns}
      />,
    );

    // BookCover component should render (it will show a skeleton initially)
    expect(screen.getByTestId("book-cover-skeleton")).toBeInTheDocument();
  });
});
