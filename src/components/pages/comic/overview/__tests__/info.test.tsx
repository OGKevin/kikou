import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InfoTab from "../info";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useImageFiles", () => ({
  useImageFiles: jest.fn(),
}));

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
}));

jest.mock("@/hooks/usePreviewCache", () => ({
  usePreviewCache: jest.fn(),
}));

const mockUseImageFiles = require("@/hooks/useImageFiles").useImageFiles;
const mockUseArchiveContext =
  require("@/contexts/ArchiveContext").useArchiveContext;
const mockUsePreviewCache = require("@/hooks/usePreviewCache").usePreviewCache;

describe("InfoTab", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: {},
    });

    mockUsePreviewCache.mockReturnValue({
      previewUrl: "/test.png",
      loadingPreview: false,
      error: null,
    });
  });

  it("shows loading state", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: true,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: {} },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("shows error state", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: false,
      error: "Test error",
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: {} },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText(/Error: Test error/i)).toBeInTheDocument();
  });

  it("shows no images found message", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: [],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: {} },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText(/No images found/i)).toBeInTheDocument();
  });

  it("renders comic info with title", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: {
        comic_info: {
          Title: "Test Comic",
          Series: "Test Series",
          Number: "1",
        },
      },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getAllByText("Test Comic").length).toBeGreaterThan(0);
    expect(screen.getByText("Test Series")).toBeInTheDocument();
    expect(screen.getByText(/Issue #1/i)).toBeInTheDocument();
  });

  it("renders Unknown Title when no title provided", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: {} },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText("Unknown Title")).toBeInTheDocument();
  });

  it("renders edit button and navigates on click", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: { Title: "Test" } },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    const editButton = screen.getByRole("button", { name: /Edit/i });
    expect(editButton).toBeInTheDocument();
    expect(editButton).not.toBeDisabled();

    fireEvent.click(editButton);
    expect(mockPush).toHaveBeenCalledWith(
      "/comic/edit/edit-page-info-v2?path=%2Ftest%2Fpath.cbz",
    );
  });

  it("disables edit button when no archive path", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: { comic_info: { Title: "Test" } },
      path: null,
    });

    render(<InfoTab />);
    const editButton = screen.getByRole("button", { name: /Edit/i });
    expect(editButton).toBeDisabled();
  });

  it("renders tags when present", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: {
        comic_info: {
          Title: "Test",
          Tags: "Action,Adventure,Sci-Fi",
        },
      },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText("Sci-Fi")).toBeInTheDocument();
  });

  it("renders all comic info fields when present", () => {
    mockUseImageFiles.mockReturnValue({
      imageFiles: ["cover.jpg"],
      loading: false,
      error: null,
    });
    mockUseArchiveContext.mockReturnValue({
      result: {
        comic_info: {
          Title: "Test Comic",
          Series: "Test Series",
          Number: "1",
          Count: "12",
          Volume: "1",
          Writer: "Test Writer",
          Penciller: "Test Penciller",
          Publisher: "Test Publisher",
          Genre: "Action",
          Year: "2024",
          Month: "10",
          Day: "12",
          PageCount: "24",
        },
      },
      path: "/test/path.cbz",
    });

    render(<InfoTab />);
    expect(screen.getByText(/Count: 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Volume: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Writer: Test Writer/i)).toBeInTheDocument();
    expect(screen.getByText(/Penciller: Test Penciller/i)).toBeInTheDocument();
    expect(screen.getByText(/Publisher: Test Publisher/i)).toBeInTheDocument();
    expect(screen.getByText(/Genre: Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Date: 2024-10-12/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Count: 24/i)).toBeInTheDocument();
  });
});
