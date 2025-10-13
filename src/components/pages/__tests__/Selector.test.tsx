import { render, screen } from "@testing-library/react";
import Selector from "../Selector";

describe("Selector", () => {
  it("renders total pages and selected file", () => {
    render(
      <Selector
        imageFiles={["a.png", "b.png"]}
        targetPageNumber={"1"}
        onPageNumberChange={() => {}}
        useFileName={false}
        onUseFileNameChange={() => {}}
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
        targetPageNumber={"1"}
        onPageNumberChange={() => {}}
        useFileName={false}
        onUseFileNameChange={() => {}}
        targetFile={null}
      />,
    );
    expect(screen.getByText(/Total pages: 2/)).toBeInTheDocument();
  });
});
