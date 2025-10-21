import React from "react";
import { render, screen } from "@testing-library/react";
import PanelTitle from "../PanelTitle";

describe("PanelTitle", () => {
  it("renders and centers the title", () => {
    render(<PanelTitle>Test Title</PanelTitle>);
    const titleBox = screen.getByTestId("panel-title");
    const titleText = screen.getByTestId("panel-title-text");
    expect(titleBox).toBeInTheDocument();
    expect(titleText).toHaveTextContent("Test Title");
    expect(titleBox).toHaveStyle("text-align: center");
  });

  it("supports different heading levels", () => {
    render(<PanelTitle level="h2">Another Title</PanelTitle>);
    const titleText = screen.getByTestId("panel-title-text");
    expect(titleText.tagName.toLowerCase()).toBe("h2");
    expect(titleText).toHaveTextContent("Another Title");
  });

  it("applies custom sx prop", () => {
    render(
      <PanelTitle sx={{ backgroundColor: "red" }}>Styled Title</PanelTitle>,
    );
    const titleBox = screen.getByTestId("panel-title");
    expect(titleBox).toHaveStyle("background-color: rgb(255, 0, 0)");
  });
});
