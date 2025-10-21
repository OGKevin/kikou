import React from "react";
import { Box, Stack, Button, Typography, Alert, ButtonGroup } from "@mui/joy";
import Editor from "@monaco-editor/react";
import TooltipButton from "../ui/TooltipButton";
import ConfirmationButton from "../ui/ConfirmationButton";
import { useRouter } from "next/router";
import { useComicInfoXML } from "@/hooks/useComicInfoXML";
import { useXmlEditorUI } from "@/hooks/useXmlEditorUI";
import { useTheme } from "@/contexts/ThemeContext";
import { useComicInfo } from "@/hooks/useComicInfo";

interface XmlEditorProps {
  onAfterSave?: () => void;
  onAfterDelete?: () => void;
}

export default function XmlEditor({
  onAfterSave,
  onAfterDelete,
}: XmlEditorProps = {}) {
  const { resolvedMode } = useTheme();
  const router = useRouter();
  const path = router.query.path as string;
  const xmlOps = useComicInfoXML(path);
  const xmlUI = useXmlEditorUI();
  const { reloadComicInfo } = useComicInfo();

  const {
    xml,
    setXml,
    isValid,
    isValidating,
    validationMessage,
    isSaving,
    hasUnsavedChanges,
    isDeleting,
    error,
    saveXml,
    formatXml,
    deleteXml,
    resetXml,
    validateXml,
    clearValidation,
  } = xmlOps;
  const {
    saveSuccess,
    formatSuccess,
    deleteSuccess,
    showSuccessMessage,
    clearAllMessages,
    setDeleteDialogOpen,
  } = xmlUI;

  const handleSave = async () => {
    clearAllMessages();
    const success = await saveXml();

    if (success) {
      showSuccessMessage("save");
      clearValidation();

      if (typeof reloadComicInfo === "function") {
        await reloadComicInfo();
      }

      if (onAfterSave) onAfterSave();
    }
  };
  const handleFormat = async () => {
    clearAllMessages();
    const success = await formatXml();

    if (success) {
      showSuccessMessage("format");
    }
  };
  const handleReset = async () => {
    resetXml();
    clearAllMessages();
  };
  const handleDelete = async () => {
    clearAllMessages();
    const success = await deleteXml();

    if (success) {
      showSuccessMessage("delete");

      if (onAfterDelete) onAfterDelete();
    }

    setDeleteDialogOpen(false);
  };
  const handleValidate = async () => {
    await validateXml();
  };
  const handleClearValidation = () => {
    clearValidation();
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <Typography level="h3" sx={{ mb: 2 }}>
          Edit ComicInfo.xml
        </Typography>
        {error && (
          <Alert color="danger" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {saveSuccess && (
          <Alert color="success" sx={{ mb: 2 }}>
            ComicInfo.xml saved successfully!
          </Alert>
        )}
        {formatSuccess && (
          <Alert color="success" sx={{ mb: 2 }}>
            ComicInfo.xml formatted successfully!
          </Alert>
        )}
        {deleteSuccess && (
          <Alert color="success" sx={{ mb: 2 }}>
            ComicInfo.xml deleted successfully!
          </Alert>
        )}
        {validationMessage && (
          <Alert color={isValid ? "success" : "danger"} sx={{ mb: 2 }}>
            {validationMessage}
          </Alert>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          mb: 2,
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="xml"
          value={xml}
          onChange={(value) => setXml(value || "")}
          theme={resolvedMode === "dark" ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: true,
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            folding: true,
            lineNumbers: "on",
            renderWhitespace: "boundary",
            selectOnLineNumbers: true,
            selectionHighlight: true,
          }}
        />
      </Box>
      <Stack
        direction="row"
        spacing={2}
        sx={{ flexShrink: 0, justifyContent: "center" }}
      >
        <ButtonGroup
          spacing="0.5rem"
          size="lg"
          variant="solid"
          aria-label="plain button group"
        >
          <Button onClick={handleValidate} disabled={isValidating}>
            {isValidating ? "Validating..." : "Validate XML"}
          </Button>
          <TooltipButton
            onClick={handleClearValidation}
            disabled={!validationMessage}
            tooltip="You must validate the XML for it to be cleared."
          >
            Clear Validation
          </TooltipButton>
          <TooltipButton
            onClick={handleSave}
            disabled={isSaving || !xml?.trim() || !hasUnsavedChanges}
            color="primary"
            tooltip={
              !hasUnsavedChanges ? "There are no changes to be saved." : null
            }
          >
            {isSaving ? "Saving..." : "Save"}
          </TooltipButton>
          <Button
            onClick={handleFormat}
            disabled={isSaving || !xml?.trim()}
            color="neutral"
          >
            Format
          </Button>
          <ConfirmationButton
            color="danger"
            sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
            onConfirm={handleReset}
            disabled={!hasUnsavedChanges}
            confirmTitle="Confirm Reset"
            confirmMessage={"Are you sure you want to reset changes?"}
            confirmLabel="Yes, Reset"
            cancelLabel="Cancel"
            tooltip={!hasUnsavedChanges ? "Nothing to reset." : null}
          >
            Reset
          </ConfirmationButton>
          <ConfirmationButton
            color="danger"
            size="lg"
            sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
            onConfirm={handleDelete}
            disabled={isDeleting}
            confirmTitle="Confirm Deletion"
            confirmMessage={
              "Are you sure you want to delete ComicInfo.xml from this archive? This action cannot be undone."
            }
            confirmLabel="Yes, Delete"
            tooltip={isDeleting ? null : undefined}
          >
            Delete ComicInfo.xml
          </ConfirmationButton>
        </ButtonGroup>
      </Stack>
    </Box>
  );
}
