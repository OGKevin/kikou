import React, { useState } from "react";
import { Box, Stack } from "@mui/joy";
import PagePreviewPanel from "../pages/PreviewPanel";
import PageSettingsPanel from "../pages/SettingsPanel";
import PageSelector from "../pages/Selector";
import { createBlankPageInfo, ComicPageInfo } from "../../types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useImageFiles } from "@/hooks/useImageFiles";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";

export default function TocTab() {
  const { tocFile, selectedPage, setSelectedPage } = useArchiveContext()!;
  const { imageFiles } = useImageFiles();
  const {
    currentSettings,
    updatePageSettings,
    resetPageSettings,
    isSaving,
    hasEditedPages,
    saveAllSettings,
  } = usePageSettingsContext();
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedFile = imageFiles[selectedPage] ?? null;
  const targetPageNumber = String(selectedPage + 1);

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

  const handlePageIndexChange = (index: number) => {
    setSelectedPage(index);
  };

  const handleUpdateSettings = (updates: Partial<ComicPageInfo>) => {
    if (selectedFile) {
      updatePageSettings(selectedFile, updates);
    }
  };

  const handleReset = () => {
    if (selectedFile) {
      resetPageSettings(selectedFile);
    }
  };

  const currentTargetSettings = selectedFile
    ? currentSettings[selectedFile] || createBlankPageInfo()
    : createBlankPageInfo();

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
      <PagePreviewPanel
        targetFile={tocFile}
        targetPageNumber={targetPageNumber}
        title="Table of Contents"
        buttons={[saveButton]}
      />
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          height: "100%",
        }}
      >
        <PageSelector
          selectedIndex={selectedPage}
          onPageIndexChange={handlePageIndexChange}
          imageFiles={imageFiles}
          targetFile={selectedFile}
        />
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            height: "100%",
          }}
        >
          <PagePreviewPanel
            targetFile={selectedFile}
            targetPageNumber={targetPageNumber}
          />
          <PageSettingsPanel
            targetFile={selectedFile}
            errorMessage={localError}
            currentSettings={currentTargetSettings}
            onUpdateSettings={handleUpdateSettings}
            onReset={handleReset}
          />
        </Stack>
      </Box>
    </Box>
  );
}
