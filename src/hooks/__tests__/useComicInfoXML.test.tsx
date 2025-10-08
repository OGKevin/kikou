import React from "react";
import { render, act } from "@testing-library/react";
import { useComicInfoXML } from "../useComicInfoXML";

// Mock tauri invoke
jest.mock("@tauri-apps/api/core", () => ({
  invoke: jest.fn().mockResolvedValue(""),
}));

// Mock devLog
jest.mock("@/utils/devLog", () => ({
  devLog: jest.fn(),
}));

// Mock ArchiveContext
const mockArchiveContext = {
  hasUnsavedXmlChanges: false,
  setHasUnsavedXmlChanges: jest.fn(),
  reload: jest.fn(),
};

jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: () => mockArchiveContext,
}));

function TestComponent({
  path,
  expectedXml = "",
  onXmlUpdate,
}: {
  path: string;
  expectedXml?: string;
  onXmlUpdate?: (xml: string) => void;
}) {
  const xmlOps = useComicInfoXML(path);

  React.useEffect(() => {
    if (expectedXml && onXmlUpdate) {
      xmlOps.setXml(expectedXml);
      onXmlUpdate(expectedXml);
    }
  }, [expectedXml, onXmlUpdate, xmlOps.setXml]);

  return null;
}

describe("useComicInfoXML - hasUnsavedChanges context integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockArchiveContext.hasUnsavedXmlChanges = false;
  });

  it("should call setHasUnsavedXmlChanges with false when xml equals originalXml initially", async () => {
    await act(async () => {
      render(<TestComponent path="test.cbz" />);
    });

    // Should be called with false initially since both xml and originalXml are empty
    expect(mockArchiveContext.setHasUnsavedXmlChanges).toHaveBeenCalledWith(
      false,
    );
  });

  it("should call setHasUnsavedXmlChanges with true when xml is changed", async () => {
    let xmlUpdated = false;

    await act(async () => {
      render(
        <TestComponent
          path="test.cbz"
          expectedXml="changed xml"
          onXmlUpdate={() => {
            xmlUpdated = true;
          }}
        />,
      );
    });

    // Wait for the XML to be updated
    await act(async () => {
      // Give time for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(xmlUpdated).toBe(true);
    expect(mockArchiveContext.setHasUnsavedXmlChanges).toHaveBeenCalledWith(
      true,
    );
  });
});
