import React, { useState } from "react";
import { PanelGroup } from "react-resizable-panels";
import { Box, Button } from "@mui/joy";
import PageSelector from "../pages/Selector";
import { createBlankPageInfo, ComicPageInfo } from "../../types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useImageFiles } from "@/hooks/useImageFiles";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";
import {
  ResizablePagePreviewPanel,
  ResizablePageSettingsPanel,
  ResizableHandle,
} from "@/components/resizable";

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

  const handleSave = async () => {
    try {
      await saveAllSettings();
      window.dispatchEvent(new CustomEvent("bookmarksUpdated"));
      setLocalError(null);
    } catch (error) {
      setLocalError("Failed to save settings: " + error);
    }
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
      id="toc-tab-root"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        height: "100%",
        p: 1.5,
        gap: 1.5,
      }}
    >
      <Box
        id="toc-tab-header"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box sx={{ flex: 1 }} />

        <PageSelector
          id="toc-tab-selector"
          selectedIndex={selectedPage}
          onPageIndexChange={handlePageIndexChange}
          imageFiles={imageFiles}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            id="toc-tab-save-button"
            onClick={handleSave}
            disabled={isSaving || !hasEditedPages}
            variant="solid"
            color="success"
            size="md"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </Box>
      </Box>

      <PanelGroup
        id="toc-tab-panel-group"
        direction="horizontal"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          height: "100%",
          paddingLeft: "12px",
          paddingRight: "12px",
        }}
      >
        <ResizablePagePreviewPanel
          id="toc-tab-toc-preview"
          targetFile={tocFile}
          targetPageNumber={targetPageNumber}
          title="Table of Contents"
          defaultSize={25}
          minSize={15}
        />

        <ResizableHandle id="toc-tab-handle-1" />

        <ResizablePagePreviewPanel
          id="toc-tab-selected-preview"
          targetFile={selectedFile}
          targetPageNumber={targetPageNumber}
          defaultSize={50}
          minSize={25}
        />

        <ResizableHandle id="toc-tab-handle-2" />

        <ResizablePageSettingsPanel
          id="toc-tab-settings-panel"
          targetFile={selectedFile}
          errorMessage={localError}
          currentSettings={currentTargetSettings}
          onUpdateSettings={handleUpdateSettings}
          onReset={handleReset}
          defaultSize={25}
          minSize={15}
        />
      </PanelGroup>
    </Box>
  );
}
