import React from "react";
import { render, act } from "@testing-library/react";
import { useStreamPreviews } from "../useStreamPreviews";
import { useArchiveContext } from "@/contexts/ArchiveContext";

// Mock useArchiveContext
jest.mock("@/contexts/ArchiveContext", () => ({
  useArchiveContext: jest.fn(),
}));

// Mock streamFileData
const mockStreamFileData = jest.fn();
jest.mock("@/api/streamFileData", () => ({
  streamFileData: (...args: any[]) => mockStreamFileData(...args),
}));

describe("useStreamPreviews", () => {
  let previewCache: Record<string, string>;
  const mockCtx = {
    path: "/test/path",
    previewCache: { current: {} },
  };

  beforeEach(() => {
    previewCache = {};
    mockCtx.previewCache.current = previewCache;
    (useArchiveContext as jest.Mock).mockReturnValue(mockCtx);
    mockStreamFileData.mockReset();
  });

  function TestComponent({ fileNames, onProgress, onFinish }: any) {
    useStreamPreviews({ fileNames, onProgress, onFinish });
    return null;
  }

  it("should not stream if no files", () => {
    render(<TestComponent fileNames={[]} />);
    expect(mockStreamFileData).not.toHaveBeenCalled();
  });

  it("should skip streaming if all files are cached", () => {
    previewCache["a.jpg"] = "dataurl";
    render(<TestComponent fileNames={["a.jpg"]} />);
    expect(mockStreamFileData).not.toHaveBeenCalled();
  });

  it("should cache previews as events arrive", async () => {
    const events = [
      { event: "started", data: { total_files: 2 } },
      { event: "preview", data: { file_name: "a.jpg", data_base64: "AQID" } },
      { event: "preview", data: { file_name: "b.jpg", data_base64: "BAUG" } },
      { event: "finished", data: {} },
    ];
    mockStreamFileData.mockImplementation(async ({ onEvent }: any) => {
      for (const e of events) onEvent(e);
    });
    await act(async () => {
      render(<TestComponent fileNames={["a.jpg", "b.jpg"]} />);
    });
    expect(previewCache["a.jpg"]).toContain("data:image/jpeg;base64");
    expect(previewCache["b.jpg"]).toContain("data:image/jpeg;base64");
  });

  it("should call onProgress correctly", async () => {
    const events = [
      { event: "started", data: { total_files: 1 } },
      { event: "preview", data: { file_name: "a.jpg", data_base64: "AQID" } },
      { event: "finished", data: {} },
    ];
    mockStreamFileData.mockImplementation(async ({ onEvent }: any) => {
      for (const e of events) onEvent(e);
    });
    const onProgress = jest.fn();
    await act(async () => {
      render(<TestComponent fileNames={["a.jpg"]} onProgress={onProgress} />);
    });
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it("should handle error events", async () => {
    const events = [
      { event: "started", data: { total_files: 1 } },
      { event: "error", data: { file_name: "a.jpg", message: "fail" } },
      { event: "finished", data: {} },
    ];
    mockStreamFileData.mockImplementation(async ({ onEvent }: any) => {
      for (const e of events) onEvent(e);
    });
    const onProgress = jest.fn();
    await act(async () => {
      render(<TestComponent fileNames={["a.jpg"]} onProgress={onProgress} />);
    });
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it("should call onFinish when streaming completes", async () => {
    const events = [
      { event: "started", data: { total_files: 1 } },
      { event: "preview", data: { file_name: "a.jpg", data_base64: "AQID" } },
      { event: "finished", data: {} },
    ];
    mockStreamFileData.mockImplementation(async ({ onEvent }: any) => {
      for (const e of events) onEvent(e);
    });
    const onFinish = jest.fn();
    await act(async () => {
      render(<TestComponent fileNames={["a.jpg"]} onFinish={onFinish} />);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should call onFinish when all files are already cached", async () => {
    previewCache["a.jpg"] = "dataurl";
    const onFinish = jest.fn();
    await act(async () => {
      render(<TestComponent fileNames={["a.jpg"]} onFinish={onFinish} />);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("should call onFinish and onProgress together on completion", async () => {
    const events = [
      { event: "started", data: { total_files: 2 } },
      { event: "preview", data: { file_name: "a.jpg", data_base64: "AQID" } },
      { event: "preview", data: { file_name: "b.jpg", data_base64: "BAUG" } },
      { event: "finished", data: {} },
    ];
    mockStreamFileData.mockImplementation(async ({ onEvent }: any) => {
      for (const e of events) onEvent(e);
    });
    const onProgress = jest.fn();
    const onFinish = jest.fn();
    await act(async () => {
      render(
        <TestComponent
          fileNames={["a.jpg", "b.jpg"]}
          onProgress={onProgress}
          onFinish={onFinish}
        />,
      );
    });
    expect(onProgress).toHaveBeenLastCalledWith(2, 2);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
