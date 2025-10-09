import React, { useRef, useState, useEffect } from "react";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import {
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Stack,
  Sheet,
  FormControl,
  FormLabel,
  ListItemContent,
  ListItemDecorator,
} from "@mui/joy";
import { Bookmark, Edit, MenuBook } from "@mui/icons-material";
import { isBookmarked } from "@/types/comic";
import { useBookmarkedFiles } from "@/hooks/useBookmarkedFiles";

interface FileListProps {
  imageFiles: string[];
  storageManager: {
    getShowFiltered: () => boolean;
    setShowFiltered: (value: boolean) => void;
    getShowBookmarkFiltered: () => boolean;
    setShowBookmarkFiltered: (value: boolean) => void;
    setTocFile: (file: string) => void;
  };
}

const FileList: React.FC<FileListProps> = ({ imageFiles, storageManager }) => {
  const { tocFile, setTocFile, selectedPage, setSelectedPage } =
    useArchiveContext()!;
  const bookmarkedFilesFromBackend = useBookmarkedFiles();
  const [selectedFile, setSelectedFile] = useState<string | null>(
    imageFiles[selectedPage] ?? null,
  );

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: string | null;
  } | null>(null);
  const [showFiltered, setShowFiltered] = useState(false);
  const [showBookmarkFiltered, setShowBookmarkFiltered] = useState(false);
  const { currentSettings, isPageEdited } = usePageSettingsContext();
  const listRef = useRef<HTMLUListElement>(null);

  const handleContextMenu = (e: React.MouseEvent, file: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleMarkAsToC = () => {
    if (contextMenu?.file) {
      setTocFile(contextMenu.file);
      storageManager.setTocFile(contextMenu.file);
      setContextMenu(null);
    }
  };

  // Initialize filter states from storage on mount or imageFiles change
  useEffect(() => {
    setShowFiltered(storageManager.getShowFiltered());
    setShowBookmarkFiltered(storageManager.getShowBookmarkFiltered());
  }, [storageManager, imageFiles]);

  // Sync selectedFile with selectedPage changes
  useEffect(() => {
    setSelectedFile(imageFiles[selectedPage] ?? null);
  }, [selectedPage, imageFiles]);

  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => setContextMenu(null);

      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  // Filtering logic - filters are exclusive
  let filteredFiles = imageFiles;

  if (showFiltered) {
    filteredFiles = imageFiles.filter(
      (file) => tocFile === file || isPageEdited(file),
    );
  } else if (showBookmarkFiltered) {
    filteredFiles = imageFiles.filter(
      (file) =>
        tocFile === file ||
        (currentSettings[file] && isBookmarked(currentSettings[file])) ||
        bookmarkedFilesFromBackend.includes(file),
    );
  }

  // Auto-select first file when current selection is filtered out
  useEffect(() => {
    if (
      selectedFile &&
      !filteredFiles.includes(selectedFile) &&
      filteredFiles.length > 0
    ) {
      const idx = imageFiles.indexOf(filteredFiles[0]);

      setSelectedPage(idx);
    }
  }, [filteredFiles, selectedFile, setSelectedPage, imageFiles]);

  // Auto-scroll to selected file
  useEffect(() => {
    if (selectedFile && listRef.current) {
      const selectedIndex = filteredFiles.indexOf(selectedFile);

      if (selectedIndex !== -1) {
        const listItems = listRef.current.children;
        const selectedItem = listItems[selectedIndex] as HTMLElement;

        if (selectedItem) {
          selectedItem.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    }
  }, [selectedFile, filteredFiles]);

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: 300,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "sm",
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography level="title-md" sx={{ fontWeight: "bold" }}>
          Files ({filteredFiles.length})
        </Typography>
      </Box>
      {/* Filter Controls */}
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <FormControl size="sm">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Checkbox
                size="sm"
                checked={showFiltered}
                onChange={(e) => {
                  const newState = e.target.checked;

                  setShowFiltered(newState);
                  storageManager.setShowFiltered(newState);

                  if (newState) {
                    setShowBookmarkFiltered(false);
                    storageManager.setShowBookmarkFiltered(false);
                  }
                }}
              />
              <FormLabel sx={{ fontSize: "sm" }}>
                Show only ToC & edited
              </FormLabel>
            </Box>
          </FormControl>

          <FormControl size="sm">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Checkbox
                size="sm"
                checked={showBookmarkFiltered}
                onChange={(e) => {
                  const newState = e.target.checked;

                  setShowBookmarkFiltered(newState);
                  storageManager.setShowBookmarkFiltered(newState);

                  if (newState) {
                    setShowFiltered(false);
                    storageManager.setShowFiltered(false);
                  }
                }}
              />
              <FormLabel sx={{ fontSize: "sm" }}>
                Show only ToC & bookmarked
              </FormLabel>
            </Box>
          </FormControl>
        </Stack>
      </Box>
      {/* File List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <List
          size="sm"
          sx={{ py: 0 }}
          tabIndex={0}
          ref={listRef}
          onFocus={() => listRef.current?.focus()}
          onKeyDown={(e) => {
            if (!filteredFiles.length) return;

            const currentIdx = filteredFiles.indexOf(selectedFile ?? "");

            if (e.key === "ArrowDown") {
              const nextIdx =
                currentIdx < filteredFiles.length - 1 ? currentIdx + 1 : 0;

              const idx = imageFiles.indexOf(filteredFiles[nextIdx]);

              setSelectedPage(idx);
              e.preventDefault();
            }

            if (e.key === "ArrowUp") {
              const prevIdx =
                currentIdx > 0 ? currentIdx - 1 : filteredFiles.length - 1;

              const idx = imageFiles.indexOf(filteredFiles[prevIdx]);

              setSelectedPage(idx);
              e.preventDefault();
            }
          }}
        >
          {filteredFiles.map((file) => {
            const isEdited = isPageEdited(file);
            const isSelected = selectedFile === file;
            const isFileBookmarked =
              (currentSettings[file] && isBookmarked(currentSettings[file])) ||
              bookmarkedFilesFromBackend.includes(file);

            return (
              <ListItem key={file}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    const idx = imageFiles.indexOf(file);

                    setSelectedPage(idx);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  sx={{
                    py: 1,
                    px: 2,
                    borderLeft:
                      isEdited || isFileBookmarked ? "3px solid" : "none",
                    borderLeftColor: isEdited ? "primary.main" : "warning.main",
                  }}
                >
                  <ListItemDecorator sx={{ minWidth: 24 }}>
                    {isEdited && (
                      <Edit sx={{ fontSize: 16, color: "primary.main" }} />
                    )}
                    {!isEdited && isFileBookmarked && (
                      <Bookmark sx={{ fontSize: 16, color: "warning.main" }} />
                    )}
                  </ListItemDecorator>

                  <ListItemContent>
                    <Typography
                      level="body-sm"
                      sx={{
                        color: isEdited
                          ? "primary.main"
                          : isFileBookmarked
                            ? "warning.main"
                            : "text.primary",
                        fontWeight:
                          isEdited || isFileBookmarked ? "md" : "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {file}
                    </Typography>
                  </ListItemContent>

                  {tocFile === file && (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="solid"
                      startDecorator={<MenuBook sx={{ fontSize: 12 }} />}
                      sx={{ fontSize: "xs", minHeight: "20px" }}
                    >
                      ToC
                    </Chip>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>
      {/* Context Menu */}
      {contextMenu && (
        <Sheet
          variant="outlined"
          sx={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            boxShadow: "lg",
            zIndex: 1000,
            borderRadius: "sm",
            overflow: "hidden",
          }}
        >
          <List size="sm" sx={{ p: 0, minWidth: 140 }}>
            <ListItem>
              <ListItemButton
                onClick={handleMarkAsToC}
                disabled={tocFile === contextMenu.file}
                sx={{ py: 1, px: 2 }}
              >
                <ListItemDecorator>
                  <MenuBook sx={{ fontSize: 16 }} />
                </ListItemDecorator>
                <ListItemContent>
                  <Typography level="body-sm">Mark as ToC</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          </List>
        </Sheet>
      )}
    </Sheet>
  );
};

export default FileList;
