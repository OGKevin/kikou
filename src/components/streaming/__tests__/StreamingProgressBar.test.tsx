import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { StreamingProgressBar } from "../StreamingProgressBar";
import { useStreamPreviews } from "@/hooks/useStreamPreviews";

jest.mock("@/hooks/useStreamPreviews");

const mockUseStreamPreviews = useStreamPreviews as jest.MockedFunction<
  typeof useStreamPreviews
>;

const TEST_FILES_3 = ["file1.jpg", "file2.jpg", "file3.jpg"];
const TEST_FILES_4 = ["file1.jpg", "file2.jpg", "file3.jpg", "file4.jpg"];
const TEST_FILES_2 = ["file1.jpg", "file2.jpg"];

describe("StreamingProgressBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when not streaming", async () => {
    let onFinishCallback: (() => void) | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(({ onStart, onFinish }) => {
      onStartCallback = onStart;
      onFinishCallback = onFinish;
      return { startStreaming: jest.fn() };
    });

    const { container } = render(
      <StreamingProgressBar fileNames={TEST_FILES_3} />,
    );

    act(() => {
      onStartCallback?.();
    });

    expect(container.querySelector("div")).toBeInTheDocument();

    await act(async () => {
      onFinishCallback?.();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when fileNames is empty", () => {
    mockUseStreamPreviews.mockImplementation(() => {
      return { startStreaming: jest.fn() };
    });

    const { container } = render(<StreamingProgressBar fileNames={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders progress bar while streaming", async () => {
    let onProgressCallback:
      | ((loaded: number, total: number) => void)
      | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(
      ({ onStart, onProgress, onFinish }) => {
        onStartCallback = onStart;
        onProgressCallback = onProgress;
        return { startStreaming: jest.fn() };
      },
    );

    render(<StreamingProgressBar fileNames={TEST_FILES_3} />);

    // Simulate streaming start
    act(() => {
      onStartCallback?.();
    });

    expect(screen.getByText(/Loading Pages \(0\/3\)/)).toBeInTheDocument();
  });

  it("displays correct progress percentage and loaded count", async () => {
    let onProgressCallback:
      | ((loaded: number, total: number) => void)
      | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(
      ({ onStart, onProgress, onFinish }) => {
        onStartCallback = onStart;
        onProgressCallback = onProgress;
        return { startStreaming: jest.fn() };
      },
    );

    render(<StreamingProgressBar fileNames={TEST_FILES_4} />);

    // Simulate streaming start
    act(() => {
      onStartCallback?.();
    });

    await act(async () => {
      onProgressCallback?.(2, 4);
    });
    expect(screen.getByText(/Loading Pages \(2\/4\)/)).toBeInTheDocument();

    await act(async () => {
      onProgressCallback?.(4, 4);
    });
    expect(screen.getByText(/Loading Pages \(4\/4\)/)).toBeInTheDocument();
  });

  it("hides progress bar when all files are loaded", async () => {
    let onFinishCallback: (() => void) | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(({ onStart, onFinish }) => {
      onStartCallback = onStart;
      onFinishCallback = onFinish;
      return { startStreaming: jest.fn() };
    });

    const { container } = render(
      <StreamingProgressBar fileNames={TEST_FILES_2} />,
    );

    act(() => {
      onStartCallback?.();
    });

    expect(container.querySelector("div")).toBeInTheDocument();

    await act(async () => {
      onFinishCallback?.();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2100));
    });
    expect(container.firstChild).toBeNull();
  });

  it("calls useStreamPreviews with correct fileNames and callbacks", () => {
    mockUseStreamPreviews.mockImplementation(() => {
      return { startStreaming: jest.fn() };
    });

    render(<StreamingProgressBar fileNames={TEST_FILES_3} />);

    expect(mockUseStreamPreviews).toHaveBeenCalledWith(
      expect.objectContaining({
        fileNames: TEST_FILES_3,
        onProgress: expect.any(Function),
        onFinish: expect.any(Function),
      }),
    );
  });

  it("calls onProgress callback when files are loaded", async () => {
    let onProgressCallback:
      | ((loaded: number, total: number) => void)
      | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(
      ({ onStart, onProgress, onFinish }) => {
        onStartCallback = onStart;
        onProgressCallback = onProgress;
        return { startStreaming: jest.fn() };
      },
    );

    render(<StreamingProgressBar fileNames={TEST_FILES_3} />);

    act(() => {
      onStartCallback?.();
    });

    await act(async () => {
      onProgressCallback?.(1, 3);
    });
    expect(screen.getByText(/Loading Pages \(1\/3\)/)).toBeInTheDocument();

    await act(async () => {
      onProgressCallback?.(3, 3);
    });
    expect(screen.getByText(/Loading Pages \(3\/3\)/)).toBeInTheDocument();
  });
});
