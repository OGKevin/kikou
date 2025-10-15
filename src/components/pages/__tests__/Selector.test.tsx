import { render, screen } from "@testing-library/react";
import Selector from "../Selector";

jest.mock("@/hooks/usePreviewCache", () => ({
  usePreviewCache: jest.fn(() => ({
    previewUrl: null,
    loading: false,
    error: null,
  })),
}));

describe("Selector", () => {
  it("renders total pages and selected file", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
        targetFile={"a.png"}
      />,
    );
    expect(screen.getByText(/Total pages: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Selected: a.png/)).toBeInTheDocument();
  });

  it("renders without selected file", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
        targetFile={null}
      />,
    );
    expect(screen.getByText(/Total pages: 2/)).toBeInTheDocument();
  });
});
