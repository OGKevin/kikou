import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PagesTab from "../pages";

jest.mock("@/hooks/useImageFiles", () => ({
  useImageFiles: jest.fn(),
}));

jest.mock("@/hooks/useComicInfo", () => ({
  useComicInfo: jest.fn(),
}));

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
}));

jest.mock("@/hooks/useBookmarkedFiles", () => ({
  useBookmarkedFiles: jest.fn(),
}));

jest.mock("@/hooks/usePreviewCache", () => ({
  usePreviewCache: jest.fn(),
}));

const mockUseImageFiles = require("@/hooks/useImageFiles").useImageFiles;
const mockUseComicInfo = require("@/hooks/useComicInfo").useComicInfo;
const mockUseArchiveContext =
  require("@/contexts/ArchiveContext").useArchiveContext;
const mockUseBookmarkedFiles =
  require("@/hooks/useBookmarkedFiles").useBookmarkedFiles;
const mockUsePreviewCache = require("@/hooks/usePreviewCache").usePreviewCache;

describe("PagesTab", () => {
  const mockSetSelectedPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePreviewCache.mockReturnValue({
      previewUrl: "/test.png",
      loadingPreview: false,
      error: null,
    });

    mockUseBookmarkedFiles.mockReturnValue([]);
  });

  it("shows loading state", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: true,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: false,
      error: "Test error",
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
  });

  it("shows no images found message", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    expect(screen.getByText(/No images found/i)).toBeInTheDocument();
  });

  it("renders pages with slider and preview panels", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {
        "page1.jpg": {
          Type: "FrontCover",
          DoublePage: false,
          Bookmark: "",
          IsEmpty: () => false,
          Equals: () => false,
        },
        "page2.jpg": {
          Type: "Story",
          DoublePage: false,
          Bookmark: "Chapter 1",
          IsEmpty: () => false,
          Equals: () => false,
        },
      },
    });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    expect(screen.getByText(/Page 1 \/ 3/i)).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("updates selected page when slider changes", async () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "2" } });

    await waitFor(() => {
      expect(mockSetSelectedPage).toHaveBeenCalled();
    });
  });

  it("navigates with arrow keys", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 1,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);

    // Simulate ArrowRight key press
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(mockSetSelectedPage).toHaveBeenCalled();

    // Simulate ArrowLeft key press
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(mockSetSelectedPage).toHaveBeenCalled();
  });

  it("displays bookmarked pages as marks on slider", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg", "page4.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });
    mockUseBookmarkedFiles.mockReturnValue(["page2.jpg", "page4.jpg"]);

    render(<PagesTab />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });

  it("displays page info in ReadOnlyPageSettingsPanel", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {
        "page1.jpg": {
          Type: "FrontCover",
          DoublePage: false,
          Bookmark: "Cover",
          IsEmpty: () => false,
          Equals: () => false,
        },
      },
    });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    // The ReadOnlyPageSettingsPanel should be rendered
    expect(screen.getByText(/Page 1 \/ 2/i)).toBeInTheDocument();
  });

  it("handles missing page info gracefully", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({
      parsedComicInfo: {}, // No info for page1.jpg
    });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    // Should render with default values
    expect(screen.getByText(/Page 1 \/ 1/i)).toBeInTheDocument();
  });

  it("renders cover preview panel", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg", "page1.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    // Check that preview panels are rendered (cover + selected page)
    const images = screen.getAllByAltText(/Page/i);
    expect(images.length).toBeGreaterThan(0);
  });

  it("disables left button when on first page", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 0,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const leftButton = screen.getByTestId("prev-page-button");
    expect(leftButton).toBeDisabled();
  });

  it("enables left button when not on first page", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 1,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const leftButton = screen.getByTestId("prev-page-button");
    expect(leftButton).not.toBeDisabled();
  });

  it("disables right button when on last page", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 2,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const rightButton = screen.getByTestId("next-page-button");
    expect(rightButton).toBeDisabled();
  });

  it("enables right button when not on last page", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 1,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const rightButton = screen.getByTestId("next-page-button");
    expect(rightButton).not.toBeDisabled();
  });

  it("calls updateSelectedPage when left button is clicked", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 1,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const leftButton = screen.getByTestId("prev-page-button");

    fireEvent.click(leftButton);
    expect(mockSetSelectedPage).toHaveBeenCalledWith(0);
  });

  it("calls updateSelectedPage when right button is clicked", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["page1.jpg", "page2.jpg", "page3.jpg"],
      loading: false,
      error: null,
    });
    mockUseComicInfo.mockReturnValue({ parsedComicInfo: {} });
    mockUseArchiveContext.mockReturnValue({
      selectedPage: 1,
      setSelectedPage: mockSetSelectedPage,
    });

    render(<PagesTab />);
    const rightButton = screen.getByTestId("next-page-button");

    fireEvent.click(rightButton);
    expect(mockSetSelectedPage).toHaveBeenCalledWith(2);
  });
});
