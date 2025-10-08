import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  Option,
  Input,
  Button,
  Stack,
  FormControl,
  FormLabel,
  Sheet,
  Divider,
  Alert,
} from "@mui/joy";
import { devLog } from "@/utils/devLog";
import { PageType, ComicPageInfo, createBlankPageInfo } from "@/types/comic";
import { usePageSettingsContext } from "@/contexts/PageSettingsContext";

interface PageSettingsPanelProps {
  targetFile: string | null;
  currentSettings: ComicPageInfo;
  onUpdateSettings: (updates: Partial<ComicPageInfo>) => void;
  onReset: () => void;
  showSaveButton?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
}

export default function PageSettingsPanel({
  targetFile,
  currentSettings,
  onUpdateSettings,
  onReset,
  showSaveButton = false,
  onSave,
  isSaving = false,
  errorMessage,
}: PageSettingsPanelProps) {
  const { originalSettings, isPageEdited } = usePageSettingsContext();

  const [localBookmark, setLocalBookmark] = useState(currentSettings.Bookmark);
  const bookmarkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedUpdateBookmark = useCallback(
    (value: string) => {
      if (bookmarkTimeoutRef.current) {
        clearTimeout(bookmarkTimeoutRef.current);
      }

      bookmarkTimeoutRef.current = setTimeout(() => {
        onUpdateSettings({ Bookmark: value });
      }, 250);
    },
    [onUpdateSettings],
  );

  useEffect(() => {
    return () => {
      if (bookmarkTimeoutRef.current) {
        clearTimeout(bookmarkTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setLocalBookmark(currentSettings.Bookmark);
  }, [currentSettings.Bookmark]);

  devLog(
    "PageSettingsPanel rendered with currentSettings for",
    targetFile,
    currentSettings,
    originalSettings,
  );

  if (currentSettings.Type === PageType.Loading) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          width: 300,
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180,
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        <Typography level="body-lg" color="neutral">
          Loading page info...
        </Typography>
      </Sheet>
    );
  }

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: 300,
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      <Typography
        level="h3"
        sx={{
          mb: 2.5,
          p: 2.5,
          // mx: -2.5,
          mt: -2.5,
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: "background.surface",
          textAlign: "center",
        }}
      >
        Page Settings
      </Typography>
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        {errorMessage && (
          <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        {targetFile ? (
          <>
            <Stack spacing={2}>
              <FormControl size="sm">
                <FormLabel>Type</FormLabel>
                <Select
                  value={currentSettings.Type}
                  onChange={(_, value) =>
                    onUpdateSettings({ Type: value as PageType })
                  }
                  size="sm"
                >
                  <Option value={PageType.Unknown}>Unknown</Option>
                  <Option value={PageType.FrontCover}>FrontCover</Option>
                  <Option value={PageType.InnerCover}>InnerCover</Option>
                  <Option value={PageType.Roundup}>Roundup</Option>
                  <Option value={PageType.Story}>Story</Option>
                  <Option value={PageType.Advertisement}>Advertisement</Option>
                  <Option value={PageType.Editorial}>Editorial</Option>
                  <Option value={PageType.Letters}>Letters</Option>
                  <Option value={PageType.Preview}>Preview</Option>
                  <Option value={PageType.BackCover}>BackCover</Option>
                  <Option value={PageType.Other}>Other</Option>
                  <Option value={PageType.Deleted}>Deleted</Option>
                </Select>
              </FormControl>

              <FormControl size="sm">
                <FormLabel>Double Page</FormLabel>
                <Select
                  value={currentSettings.DoublePage ? "yes" : "no"}
                  onChange={(_, value) =>
                    onUpdateSettings({ DoublePage: value === "yes" })
                  }
                  size="sm"
                >
                  <Option value="no">No</Option>
                  <Option value="yes">Yes</Option>
                </Select>
              </FormControl>

              <FormControl size="sm">
                <FormLabel>Bookmark</FormLabel>
                <Input
                  value={localBookmark}
                  onChange={(e) => {
                    setLocalBookmark(e.target.value);
                    debouncedUpdateBookmark(e.target.value);
                  }}
                  size="sm"
                  placeholder="Chapter title, etc."
                />
              </FormControl>

              <Stack spacing={1.5}>
                <Button
                  onClick={onReset}
                  variant="soft"
                  color="danger"
                  size="sm"
                >
                  Reset
                </Button>
                {showSaveButton && (
                  <Button
                    onClick={onSave}
                    disabled={isSaving}
                    variant="solid"
                    color="success"
                    size="sm"
                  >
                    {isSaving ? "Saving..." : "Save to Archive"}
                  </Button>
                )}
              </Stack>
            </Stack>

            {targetFile && isPageEdited(targetFile) && (
              <>
                <Divider sx={{ my: 2 }} />

                <Typography level="h4" sx={{ mb: 1 }}>
                  Original Settings
                </Typography>

                <Stack spacing={2}>
                  <FormControl size="sm">
                    <FormLabel>Type</FormLabel>
                    <Select
                      value={
                        (originalSettings[targetFile] || createBlankPageInfo())
                          .Type
                      }
                      size="sm"
                      disabled
                    >
                      <Option value={PageType.Unknown}>Unknown</Option>
                      <Option value={PageType.FrontCover}>FrontCover</Option>
                      <Option value={PageType.InnerCover}>InnerCover</Option>
                      <Option value={PageType.Roundup}>Roundup</Option>
                      <Option value={PageType.Story}>Story</Option>
                      <Option value={PageType.Advertisement}>
                        Advertisement
                      </Option>
                      <Option value={PageType.Editorial}>Editorial</Option>
                      <Option value={PageType.Letters}>Letters</Option>
                      <Option value={PageType.Preview}>Preview</Option>
                      <Option value={PageType.BackCover}>BackCover</Option>
                      <Option value={PageType.Other}>Other</Option>
                      <Option value={PageType.Deleted}>Deleted</Option>
                    </Select>
                  </FormControl>

                  <FormControl size="sm">
                    <FormLabel>Double Page</FormLabel>
                    <Select
                      value={
                        (originalSettings[targetFile] || createBlankPageInfo())
                          .DoublePage
                          ? "yes"
                          : "no"
                      }
                      size="sm"
                      disabled
                    >
                      <Option value="no">No</Option>
                      <Option value="yes">Yes</Option>
                    </Select>
                  </FormControl>

                  <FormControl size="sm">
                    <FormLabel>Bookmark</FormLabel>
                    <Input
                      value={
                        (originalSettings[targetFile] || createBlankPageInfo())
                          .Bookmark
                      }
                      size="sm"
                      placeholder="Chapter title, etc."
                      disabled
                    />
                  </FormControl>
                </Stack>
              </>
            )}
          </>
        ) : (
          <Typography color="neutral">
            Select a page to edit its settings
          </Typography>
        )}
      </Box>
    </Sheet>
  );
}
