import React, { useEffect, useState } from "react";
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
  const [useFileName, setUseFileName] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const initialInputPageNumber = String(selectedPage + 1);
  const [inputPageNumber, setInputPageNumber] = useState<string>(
    initialInputPageNumber,
  );

  const selectedFile = imageFiles[selectedPage] ?? null;

  const targetPageNumber = inputPageNumber;

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

  const handlePageNumberChange = (val: string) => {
    setInputPageNumber(val);
  };

  const handleUseFileNameChange = (checked: boolean) => {
    setUseFileName(checked);
  };

  useEffect(() => {
    if (inputPageNumber === "") {
      setSelectedPage(-1);
      return;
    }

    let idx = 0;

    if (useFileName) {
      idx = imageFiles.findIndex((f) => f.includes(inputPageNumber));
    }

    if (!useFileName) {
      const parsed = parseInt(inputPageNumber, 10);

      idx = Number.isNaN(parsed) ? -1 : parsed - 1;
    }

    if (idx < 0 || idx >= imageFiles.length) return;

    setSelectedPage(idx);
  }, [useFileName, inputPageNumber, imageFiles, setSelectedPage]);

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
          targetPageNumber={targetPageNumber}
          onPageNumberChange={(val) => handlePageNumberChange(val)}
          useFileName={useFileName}
          onUseFileNameChange={handleUseFileNameChange}
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
