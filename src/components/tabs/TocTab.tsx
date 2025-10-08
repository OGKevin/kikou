import React, { useState, useEffect } from "react";
import { Box, Stack } from "@mui/joy";
import PagePreviewPanel from "../pages/PreviewPanel";
import PageSettingsPanel from "../pages/SettingsPanel";
import PageSelector from "../pages/Selector";
import { createBlankPageInfo, ComicPageInfo } from "../../types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useImageFiles } from "@/hooks/useImageFiles";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";

export default function TocTab() {
  const { tocFile } = useArchiveContext()!;
  const { imageFiles } = useImageFiles();
  const {
    currentSettings,
    updatePageSettings,
    resetPageSettings,
    isSaving,
    hasEditedPages,
    saveAllSettings,
  } = usePageSettingsContext();
  const [targetPageNumber, setTargetPageNumber] = useState<string>("");
  const [targetFile, setTargetFile] = useState<string | null>(null);
  const [useFileName, setUseFileName] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (targetPageNumber && imageFiles.length > 0) {
      const file = useFileName
        ? imageFiles.find((f) => f.includes(targetPageNumber))
        : imageFiles[parseInt(targetPageNumber) - 1] || null;

      setTargetFile(file || null);
    } else {
      setTargetFile(null);
    }
  }, [targetPageNumber, useFileName, imageFiles]);

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

  const handlePageNumberChange = (val: string, useFileNameVal: boolean) => {
    setTargetPageNumber(val);
    setUseFileName(useFileNameVal);
  };

  const handleUseFileNameChange = (checked: boolean) => {
    setUseFileName(checked);

    if (targetPageNumber) {
      handlePageNumberChange(targetPageNumber, checked);
    }
  };

  const handleUpdateSettings = (updates: Partial<ComicPageInfo>) => {
    if (targetFile) {
      updatePageSettings(targetFile, updates);
    }
  };

  const handleReset = () => {
    if (targetFile) {
      resetPageSettings(targetFile);
    }
  };

  const currentTargetSettings = targetFile
    ? currentSettings[targetFile] || createBlankPageInfo()
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
          onPageNumberChange={(val) => handlePageNumberChange(val, useFileName)}
          useFileName={useFileName}
          onUseFileNameChange={handleUseFileNameChange}
          imageFiles={imageFiles}
          targetFile={targetFile}
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
            targetFile={targetFile}
            targetPageNumber={targetPageNumber}
          />
          <PageSettingsPanel
            targetFile={targetFile}
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
