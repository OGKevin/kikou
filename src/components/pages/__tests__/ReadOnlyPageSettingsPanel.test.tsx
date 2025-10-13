import { render, screen } from "@testing-library/react";
import ReadOnlyPageSettingsPanel from "../ReadOnlyPageSettingsPanel";
import { ComicPageInfo, PageType } from "@/types/comic";

describe("ReadOnlyPageSettingsPanel", () => {
  const pageInfo: ComicPageInfo = {
    Type: PageType.Story,
    DoublePage: true,
    Bookmark: "Chapter 1",
    IsEmpty: () => false,
    Equals: () => false,
  };

  it("renders all fields correctly", () => {
    render(<ReadOnlyPageSettingsPanel pageInfo={pageInfo} />);
    expect(screen.getByText("Story")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("Chapter 1")).toBeInTheDocument();
  });

  it("shows '-' for empty bookmark", () => {
    render(
      <ReadOnlyPageSettingsPanel pageInfo={{ ...pageInfo, Bookmark: "" }} />,
    );
    expect(screen.getByText("-"));
  });
});
