import React from "react";
import { render, screen } from "@testing-library/react";
import PagePreviewPanel from "../PreviewPanel";
import { ErrorResponseType } from "@/types/errorResponse";

jest.mock("@/hooks/usePreviewCache", () => ({
  usePreviewCache: jest.fn(),
}));

const usePreviewCache = require("@/hooks/usePreviewCache").usePreviewCache;

describe("PagePreviewPanel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders alert when hook returns error", () => {
    usePreviewCache.mockReturnValue({
      previewUrl: null,
      loadingPreview: false,
      error: {
        error_type: ErrorResponseType.Other,
        message: "Test error",
      },
    });

    render(<PagePreviewPanel targetFile={null} targetPageNumber={"1"} />);
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it("renders loading state", () => {
    usePreviewCache.mockReturnValue({
      previewUrl: null,
      loadingPreview: true,
      error: null,
    });

    render(
      <PagePreviewPanel
        targetFile={"file.png"}
        targetPageNumber={"1"}
        title={"Test Title"}
        buttons={[]}
      />,
    );
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("renders image preview when preview is present", () => {
    usePreviewCache.mockReturnValue({
      previewUrl: "/test.png",
      loadingPreview: false,
      error: null,
    });

    render(
      <PagePreviewPanel
        targetFile={"file.png"}
        targetPageNumber={"1"}
        title={"Test Title"}
        buttons={[]}
      />,
    );
    expect(screen.getByAltText(/Page 1/i)).toBeInTheDocument();
  });
});
