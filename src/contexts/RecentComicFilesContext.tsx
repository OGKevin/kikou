import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { open } from "@tauri-apps/plugin-dialog";
import router from "next/router";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: number;
}

interface RecentComicFilesContextType {
  recentFiles: RecentFile[];
  addRecentFile: (path: string) => void;
  clearRecentFiles: () => void;
}

const RECENT_FILES_KEY = "recentCbzFiles";
const MAX_RECENT_FILES = 5;

const RecentComicFilesContext = createContext<
  RecentComicFilesContextType | undefined
>(undefined);

export function RecentComicFilesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);

  useEffect(() => {
    setRecentFiles(getRecentFiles());
  }, []);

  const addRecentFile = (path: string) => {
    const fileName = path.split("/").pop() || path;
    const recentFile: RecentFile = {
      path,
      name: fileName,
      lastOpened: Date.now(),
    };

    const existingFiles = getRecentFiles();
    const filteredFiles = existingFiles.filter((f) => f.path !== path);
    const updatedFiles = [recentFile, ...filteredFiles].slice(
      0,
      MAX_RECENT_FILES,
    );

    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updatedFiles));
    setRecentFiles(updatedFiles);
  };

  const getRecentFiles = (): RecentFile[] => {
    try {
      const stored = localStorage.getItem(RECENT_FILES_KEY);

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const clearRecentFiles = () => {
    localStorage.removeItem(RECENT_FILES_KEY);
    setRecentFiles([]);
  };

  return (
    <RecentComicFilesContext.Provider
      value={{ recentFiles, addRecentFile, clearRecentFiles }}
    >
      {children}
    </RecentComicFilesContext.Provider>
  );
}

export function useRecentComicFiles() {
  const context = useContext(RecentComicFilesContext);
  const archiveContext = useArchiveContext();

  if (!context) {
    throw new Error(
      "useRecentComicFiles must be used within a RecentComicFilesProvider",
    );
  }

  // New function to pick and select a file
  const pickAndSelectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: "CBZ Files",
          extensions: ["cbz"],
        },
      ],
    });

    if (selected) {
      context.addRecentFile(selected);
      return selected;
    }

    return null;
  };

  // New reusable function for routing to edit page
  const goToEditPage = (path: string) => {
    if (archiveContext?.path === path) {
      archiveContext.reload();

      return;
    }

    router.push(`/comic/overview?path=${encodeURIComponent(path)}&tab=edit`);
  };

  return { ...context, pickAndSelectFile, goToEditPage };
}
