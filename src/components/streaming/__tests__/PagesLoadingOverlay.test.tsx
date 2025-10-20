import React from "react";
import { render, screen, act } from "@testing-library/react";
import { PagesLoadingOverlay } from "../PagesLoadingOverlay";
import { useStreamPreviews } from "@/hooks/useStreamPreviews";

jest.mock("@/hooks/useStreamPreviews");

const mockUseStreamPreviews = useStreamPreviews as jest.MockedFunction<
  typeof useStreamPreviews
>;

const TEST_FILES_3 = ["file1.jpg", "file2.jpg", "file3.jpg"];
const TEST_FILES_2 = ["file1.jpg", "file2.jpg"];

describe("PagesLoadingOverlay", () => {
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
      <PagesLoadingOverlay fileNames={TEST_FILES_3} />,
    );

    act(() => {
      onStartCallback?.();
    });

    expect(screen.getByText("Loading Pages...")).toBeInTheDocument();

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

    const { container } = render(<PagesLoadingOverlay fileNames={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("shows overlay while streaming", async () => {
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(({ onStart }) => {
      onStartCallback = onStart;
      return { startStreaming: jest.fn() };
    });

    render(<PagesLoadingOverlay fileNames={TEST_FILES_3} />);

    act(() => {
      onStartCallback?.();
    });

    expect(screen.getByText("Loading Pages...")).toBeInTheDocument();
  });

  it("hides overlay when streaming finishes", async () => {
    let onFinishCallback: (() => void) | undefined;
    let onStartCallback: (() => void) | undefined;

    mockUseStreamPreviews.mockImplementation(({ onStart, onFinish }) => {
      onStartCallback = onStart;
      onFinishCallback = onFinish;
      return { startStreaming: jest.fn() };
    });

    const { container } = render(
      <PagesLoadingOverlay fileNames={TEST_FILES_2} />,
    );

    act(() => {
      onStartCallback?.();
    });

    expect(screen.getByText("Loading Pages...")).toBeInTheDocument();

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

    render(<PagesLoadingOverlay fileNames={TEST_FILES_3} />);

    expect(mockUseStreamPreviews).toHaveBeenCalledWith(
      expect.objectContaining({
        fileNames: TEST_FILES_3,
        onStart: expect.any(Function),
        onFinish: expect.any(Function),
      }),
    );
  });
});
