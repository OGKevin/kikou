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
    expect(screen.getByTestId("info-loading")).toBeInTheDocument();
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
    expect(screen.getByTestId("info-error")).toBeInTheDocument();
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
    expect(screen.getByTestId("info-no-images")).toBeInTheDocument();
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
    expect(screen.getByTestId("comic-title")).toBeInTheDocument();
    expect(screen.getByTestId("comic-series")).toBeInTheDocument();
    expect(screen.getByTestId("comic-number")).toBeInTheDocument();
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
    expect(screen.getByTestId("comic-title")).toHaveTextContent(
      "Unknown Title",
    );
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
    const editButton = screen.getByTestId("info-edit-button");
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
    const editButton = screen.getByTestId("info-edit-button");
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
    expect(screen.getByTestId("comic-tag-0")).toHaveTextContent("Action");
    expect(screen.getByTestId("comic-tag-1")).toHaveTextContent("Adventure");
    expect(screen.getByTestId("comic-tag-2")).toHaveTextContent("Sci-Fi");
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
    expect(screen.getByTestId("comic-title")).toBeInTheDocument();
    expect(screen.getByTestId("comic-series")).toBeInTheDocument();
    expect(screen.getByTestId("comic-number")).toBeInTheDocument();
    expect(screen.getByTestId("comic-count")).toHaveTextContent("Count: 12");
    expect(screen.getByTestId("comic-volume")).toHaveTextContent("Volume: 1");
    expect(screen.getByTestId("comic-writer")).toHaveTextContent(
      "Writer: Test Writer",
    );
    expect(screen.getByTestId("comic-penciller")).toHaveTextContent(
      "Penciller: Test Penciller",
    );
    expect(screen.getByTestId("comic-publisher")).toHaveTextContent(
      "Publisher: Test Publisher",
    );
    expect(screen.getByTestId("comic-genre")).toHaveTextContent(
      "Genre: Action",
    );
    expect(screen.getByTestId("comic-date")).toHaveTextContent(
      "Date: 2024-10-12",
    );
    expect(screen.getByTestId("comic-page-count")).toHaveTextContent(
      "Page Count: 24",
    );
  });
});
