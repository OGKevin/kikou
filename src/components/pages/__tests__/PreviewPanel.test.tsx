import React from "react";
import { render, screen } from "@testing-library/react";
import PagePreviewPanel from "../PreviewPanel";
import { ErrorResponse, ErrorResponseType } from "@/types/errorResponse";

jest.mock("@/hooks/usePreviewCache", () => ({
  usePreviewCache: () => {
    return {
      previewCache: {},
      getPreview: async () => null,
      loadingPreview: null,
      error: {
        error_type: ErrorResponseType.Other,
        message: "Test error",
      } as ErrorResponse,
    };
  },
}));

describe("PagePreviewPanel", () => {
  it("renders alert when hook returns error", () => {
    render(<PagePreviewPanel targetFile={null} targetPageNumber={"1"} />);

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });
});
