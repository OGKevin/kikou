import { render, screen, waitFor } from "@testing-library/react";
import { useArchiveEvents } from "../useArchiveEvents";
import React, { act, useState } from "react";
import { listen } from "@tauri-apps/api/event";

jest.mock("@tauri-apps/api/event");

const mockUnlistenReload = jest.fn();
const mockUnlistenCreated = jest.fn();

function TestComponent({
  path,
  handlers,
}: {
  path?: string;
  handlers: { onReload?: () => void; onCreated?: () => void };
}) {
  const [reloadCalled, setReloadCalled] = useState(false);
  const [createdCalled, setCreatedCalled] = useState(false);

  useArchiveEvents(path, {
    onReload: () => {
      setReloadCalled(true);
      handlers.onReload?.();
    },
    onCreated: () => {
      setCreatedCalled(true);
      handlers.onCreated?.();
    },
  });

  return (
    <div>
      <span data-testid="reload">{String(reloadCalled)}</span>
      <span data-testid="created">{String(createdCalled)}</span>
    </div>
  );
}

describe("useArchiveEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (listen as jest.Mock).mockImplementation((eventName: string) => {
      const unlisten =
        eventName === "reload-archive"
          ? mockUnlistenReload
          : mockUnlistenCreated;

      return Promise.resolve(unlisten);
    });
  });

  it("sets up listeners when path is provided", async () => {
    const path = "/test/path.cbz";

    render(<TestComponent path={path} handlers={{}} />);

    await waitFor(() => {
      expect(listen).toHaveBeenCalledWith(
        "reload-archive",
        expect.any(Function),
      );
      expect(listen).toHaveBeenCalledWith(
        "archive-created",
        expect.any(Function),
      );
    });
  });

  it("does not set up listeners when path is undefined", () => {
    render(<TestComponent path={undefined} handlers={{}} />);
    expect(listen).not.toHaveBeenCalled();
  });

  it("calls onReload when reload-archive event matches path", async () => {
    const path = "/test/path.cbz";

    render(<TestComponent path={path} handlers={{}} />);

    await waitFor(() => {
      expect(listen).toHaveBeenCalledWith(
        "reload-archive",
        expect.any(Function),
      );
    });

    const reloadCall = (listen as jest.Mock).mock.calls.find(
      (call) => call[0] === "reload-archive",
    );
    const reloadCallback = reloadCall[1];

    act(() => {
      reloadCallback({ payload: path });
    });

    await waitFor(() => {
      expect(screen.getByTestId("reload").textContent).toBe("true");
    });
  });

  it("calls onCreated when archive-created event matches path", async () => {
    const path = "/test/path.cbz";

    render(<TestComponent path={path} handlers={{}} />);

    await waitFor(() => {
      expect(listen).toHaveBeenCalledWith(
        "archive-created",
        expect.any(Function),
      );
    });

    const createdCall = (listen as jest.Mock).mock.calls.find(
      (call) => call[0] === "archive-created",
    );
    const createdCallback = createdCall[1];

    act(() => {
      createdCallback({ payload: path });
    });

    await waitFor(() => {
      expect(screen.getByTestId("created").textContent).toBe("true");
    });
  });

  it("does not call handlers when event payload does not match path", async () => {
    const path = "/test/path.cbz";

    render(<TestComponent path={path} handlers={{}} />);

    await waitFor(() => {
      expect(listen).toHaveBeenCalledWith(
        "reload-archive",
        expect.any(Function),
      );
    });

    const reloadCall = (listen as jest.Mock).mock.calls.find(
      (call) => call[0] === "reload-archive",
    );
    const reloadCallback = reloadCall[1];

    reloadCallback({ payload: "/different/path.cbz" });

    expect(screen.getByTestId("reload").textContent).toBe("false");
  });

  it("unregisters listeners on unmount", async () => {
    const path = "/test/path.cbz";
    const { unmount } = render(<TestComponent path={path} handlers={{}} />);

    await waitFor(() => {
      expect(listen).toHaveBeenCalled();
    });

    unmount();

    expect(mockUnlistenReload).toHaveBeenCalled();
    expect(mockUnlistenCreated).toHaveBeenCalled();
  });
});
