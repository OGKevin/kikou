import React, { useState } from "react";
import { Box, Stack } from "@mui/joy";
import ComicHeader from "../pages/Header";
import PageSettingsPanel from "../pages/SettingsPanel";
import PagePreviewPanel from "../pages/PreviewPanel";
import FileList from "../file/FileList";
import { createBlankPageInfo } from "../../types/comic";
import { LocalStorageManager } from "../../utils/localStorage";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";
import { useImageFiles } from "@/hooks/useImageFiles";
import { useArchiveContext } from "@/contexts/ArchiveContext";

interface EditTabProps {
  storageManager: LocalStorageManager;
}

export default function EditTab({ storageManager }: EditTabProps) {
  const { imageFiles } = useImageFiles();
  const {
    currentSettings,
    updatePageSettings,
    resetPageSettings,
    resetAllPageSettings,
    isSaving,
    hasEditedPages,
    saveAllSettings,
  } = usePageSettingsContext();
  const [localError, setLocalError] = useState<string | null>(null);
  const { selectedPage } = useArchiveContext()!;
  const selectedFile = imageFiles[selectedPage] ?? null;

  const saveButton = {
    label: isSaving ? "Saving..." : "Save Settings",
    onClick: async () => {
      try {
        await saveAllSettings();
        window.dispatchEvent(new CustomEvent("bookmarksUpdated"));
        setLocalError(null);
      } catch (error) {
        setLocalError("Failed to save settings: " + error);
      }
    },
    disabled: isSaving || !hasEditedPages,
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
        minHeight: 0,
        height: "100%",
      }}
    >
      <FileList imageFiles={imageFiles} storageManager={storageManager} />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          height: "100%",
        }}
      >
        <ComicHeader
          title="Comic Page Editor"
          buttons={[saveButton]}
          confirmationButton={{
            onConfirm: async () => {
              resetAllPageSettings();
              setLocalError(null);
            },
            confirmTitle: "Reset All Page Settings",
            confirmMessage:
              "Are you sure you want to reset ALL page settings to their original values? This cannot be undone.",
            confirmLabel: "Reset All",
            cancelLabel: "Cancel",
            tooltip: "Reset all page settings to original",
            disabled: isSaving || !hasEditedPages,
            children: "Reset All Pages",
          }}
        />
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
            height: "100%",
            p: 1,
          }}
        >
          <PageSettingsPanel
            targetFile={selectedFile}
            currentSettings={
              selectedFile
                ? currentSettings[selectedFile] || createBlankPageInfo()
                : createBlankPageInfo()
            }
            onUpdateSettings={(updates) => {
              if (selectedFile) {
                updatePageSettings(selectedFile, updates);
              }
            }}
            onReset={() => {
              if (selectedFile) {
                resetPageSettings(selectedFile);
              }
            }}
            errorMessage={localError}
          />
          <PagePreviewPanel
            targetFile={selectedFile}
            targetPageNumber={selectedFile || ""}
          />
        </Stack>
      </Box>
    </Box>
  );
}
