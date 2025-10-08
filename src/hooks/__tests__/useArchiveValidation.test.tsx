import { render, screen } from "@testing-library/react";
import { useArchiveValidation } from "../useArchiveValidation";
import { ErrorResponseType } from "../../types/errorResponse";
import React from "react";

// Mocks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockWatchForArchiveCreation = jest.fn((path: string) =>
  Promise.resolve(),
);

jest.mock("@/api/watchForArchiveCreation", () => ({
  watchForArchiveCreation: (path: string) => mockWatchForArchiveCreation(path),
}));

const ArchiveContext = React.createContext<unknown>(null);

function ArchiveProvider({
  value,
  children,
}: {
  value: unknown;
  children: React.ReactNode;
}) {
  return (
    <ArchiveContext.Provider value={value}>{children}</ArchiveContext.Provider>
  );
}

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => React.useContext(ArchiveContext),
}));

function HookTest() {
  const result = useArchiveValidation();

  return (
    <div>
      <span data-testid="isValidArchive">{String(result.isValidArchive)}</span>
      <span data-testid="isValidXml">{String(result.isValidXml)}</span>
      <span data-testid="isLoading">{String(result.isLoading)}</span>
      <span data-testid="error">
        {result.error ? JSON.stringify(result.error) : ""}
      </span>
    </div>
  );
}

describe("useArchiveValidation", () => {
  const path = "/tmp/test.cbz";

  it("returns nulls when path is undefined", () => {
    render(
      <ArchiveProvider value={{}}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isValidArchive").textContent).toBe("null");
    expect(screen.getByTestId("isValidXml").textContent).toBe("null");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("throws if archive context is missing", () => {
    expect(() => render(<HookTest />)).toThrow(
      /must be used within an ArchiveProvider/,
    );
  });

  it("sets error and invalid flags if archive failed to load", () => {
    const error = {
      error_type: ErrorResponseType.FailedToLoadArchive,
      message: "fail",
    };

    render(
      <ArchiveProvider value={{ path, error, loading: false }}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isValidArchive").textContent).toBe("false");
    expect(screen.getByTestId("isValidXml").textContent).toBe("false");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toContain(
      "FailedToLoadArchive",
    );
    expect(mockWatchForArchiveCreation).toHaveBeenCalledWith(path);
  });

  it("sets valid archive but invalid xml if ComicInfo.xml is invalid", () => {
    const resultObj = {
      error: {
        error_type: ErrorResponseType.ComicInfoXmlInvalid,
        message: "bad xml",
      },
    };

    render(
      <ArchiveProvider value={{ path, result: resultObj, loading: false }}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isValidArchive").textContent).toBe("true");
    expect(screen.getByTestId("isValidXml").textContent).toBe("false");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("sets error and invalid flags for other archive errors", () => {
    const error = { error_type: "OtherError", message: "other" };

    render(
      <ArchiveProvider value={{ path, error, loading: false }}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isValidArchive").textContent).toBe("false");
    expect(screen.getByTestId("isValidXml").textContent).toBe("false");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toContain("OtherError");
  });

  it("sets valid archive and xml if result is present", () => {
    const resultObj = { some: "data" };

    render(
      <ArchiveProvider value={{ path, result: resultObj, loading: false }}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isValidArchive").textContent).toBe("true");
    expect(screen.getByTestId("isValidXml").textContent).toBe("true");
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  it("sets isLoading when archive is loading", () => {
    render(
      <ArchiveProvider value={{ path, loading: true }}>
        <HookTest />
      </ArchiveProvider>,
    );
    expect(screen.getByTestId("isLoading").textContent).toBe("true");
  });
});
