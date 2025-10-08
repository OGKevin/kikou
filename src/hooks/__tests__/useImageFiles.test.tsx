import { renderHook } from "@testing-library/react";
import { ArchiveProvider } from "@/contexts/ArchiveContext";
import { useImageFiles } from "@/hooks/useImageFiles";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseArchiveContext = jest.fn() as any;

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => mockUseArchiveContext(),
  ArchiveProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("useImageFiles", () => {
  it("returns imageFiles from ArchiveContext", () => {
    mockUseArchiveContext.mockReturnValue({
      result: { image_files: ["page1.jpg", "page2.jpg"] },
      loading: false,
      error: null,
    });
    const { result } = renderHook(() => useImageFiles(), {
      wrapper: ({ children }) => (
        <ArchiveProvider path="/tmp/test.cbz"> {children} </ArchiveProvider>
      ),
    });

    expect(result.current.imageFiles).toEqual(["page1.jpg", "page2.jpg"]);
  });
});
