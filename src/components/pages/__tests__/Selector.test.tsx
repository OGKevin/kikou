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
  it("renders total pages", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
      />,
    );
    expect(screen.getByText(/Total pages: 2/)).toBeInTheDocument();
  });

  it("renders select page label", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
      />,
    );
    expect(screen.getByText("Select Page:")).toBeInTheDocument();
    expect(screen.getByText(/Total pages: 2/)).toBeInTheDocument();
  });

  it("renders autocomplete input", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText("Choose a page...")).toBeInTheDocument();
  });

  it("accepts id prop", () => {
    render(
      <Selector
        id="test-selector"
        imageFiles={["a.png", "b.png"]}
        selectedIndex={0}
        onPageIndexChange={() => {}}
      />,
    );
    expect(screen.getByTestId("test-selector")).toBeInTheDocument();
  });
});
