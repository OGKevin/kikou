import React from "react";
import { render, screen } from "@testing-library/react";
import { getPageWrapper } from "../PageWrapperFactory";

jest.mock("@/contexts/ThemeContext", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
  useTheme: () => ({
    mode: "light",
    setMode: jest.fn(),
    mounted: true,
  }),
}));

// Mock wrappers
jest.mock("@/contexts/ArchiveContext", () => ({
  ArchiveProvider: ({
    children,
    path,
  }: {
    children: React.ReactNode;
    path: string;
  }) => (
    <div data-testid="archive-provider" data-path={path}>
      {children}
    </div>
  ),
  useArchiveContext: () => ({}),
}));
jest.mock("@/components/file/ArchiveValidator", () => ({
  __esModule: true,
  default: ({
    children,
    redirectToXMLEditor,
  }: {
    children: React.ReactNode;
    redirectToXMLEditor?: boolean;
  }) => (
    <div
      data-testid="archive-validator"
      data-redirect={redirectToXMLEditor ? "true" : "false"}
    >
      {children}
    </div>
  ),
}));

const DummyContent = () => <div data-testid="dummy-content">Content</div>;

function renderFactory(pathname: string, path?: string) {
  const content = <DummyContent />;

  return render(getPageWrapper({ path, pathname, content }));
}

describe("getPageWrapper", () => {
  it("wraps with ArchiveProvider for /comic/edit", () => {
    renderFactory("/comic/edit", "test.cbz");
    expect(screen.getByTestId("archive-provider")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-content")).toBeInTheDocument();
    expect(screen.queryByTestId("archive-validator")).not.toBeInTheDocument();
  });

  it("wraps with ArchiveProvider and ArchiveValidator for /comic/view", () => {
    renderFactory("/comic/view", "test.cbz");
    expect(screen.getByTestId("archive-provider")).toBeInTheDocument();
    expect(screen.getByTestId("archive-validator")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-content")).toBeInTheDocument();
    expect(screen.getByTestId("archive-validator")).toHaveAttribute(
      "data-redirect",
      "true",
    );
  });

  it("wraps with ArchiveProvider and ArchiveValidator for /comic/edit/xml, redirectToXMLEditor is false", () => {
    renderFactory("/comic/edit/xml", "test.cbz");
    expect(screen.getByTestId("archive-provider")).toBeInTheDocument();
    expect(screen.getByTestId("archive-validator")).toBeInTheDocument();
    expect(screen.getByTestId("dummy-content")).toBeInTheDocument();
    expect(screen.getByTestId("archive-validator")).toHaveAttribute(
      "data-redirect",
      "false",
    );
  });

  it("returns content unwrapped for non-comic path", () => {
    renderFactory("/other", "test.cbz");
    expect(screen.getByTestId("dummy-content")).toBeInTheDocument();
    expect(screen.queryByTestId("archive-provider")).not.toBeInTheDocument();
    expect(screen.queryByTestId("archive-validator")).not.toBeInTheDocument();
  });
});
