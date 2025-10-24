import { useState } from "react";
import {
  Modal,
  ModalClose,
  Sheet,
  Button,
  FormControl,
  FormLabel,
  Input,
  Alert,
  Stack,
  Typography,
} from "@mui/joy";
import { open } from "@tauri-apps/plugin-dialog";

export interface OpenLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onLibrarySelected: (path: string) => Promise<void>;
  isLoading?: boolean;
}

export function OpenLibraryDialog({
  open: isOpen,
  onClose,
  onLibrarySelected,
  isLoading = false,
}: OpenLibraryDialogProps) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleBrowse = async () => {
    try {
      setError(null);
      const selected = await open({
        directory: true,
        title: "Select Calibre Library",
        defaultPath: selectedPath || undefined,
      });

      if (selected) {
        setSelectedPath(selected);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to open file dialog";

      setError(errorMessage);
    }
  };

  const handleConfirm = async () => {
    if (!selectedPath) {
      setError("Please select a library path");
      return;
    }

    try {
      setError(null);
      await onLibrarySelected(selectedPath);
      setSelectedPath("");
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to open library";

      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setSelectedPath("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      aria-labelledby="modal-title"
      open={isOpen}
      onClose={handleClose}
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          maxWidth: 500,
          borderRadius: "md",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <ModalClose variant="plain" sx={{ m: 1 }} />
        <Typography
          component="h2"
          id="modal-title"
          level="h4"
          textColor="inherit"
          fontWeight="lg"
          mb={1}
        >
          Open Calibre Library
        </Typography>

        <Stack spacing={2}>
          <Alert color="primary" variant="soft">
            Select the folder containing the Calibre library (must have
            metadata.db)
          </Alert>

          {error && (
            <Alert color="danger" variant="soft">
              {error}
            </Alert>
          )}

          <FormControl>
            <FormLabel>Library Path</FormLabel>
            <Input
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              placeholder="Click Browse to select a folder"
              readOnly
            />
          </FormControl>

          <Button
            onClick={handleBrowse}
            variant="outlined"
            color="neutral"
          >
            Browse
          </Button>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Button
              onClick={handleClose}
              variant="plain"
              color="neutral"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              variant="solid"
              color="primary"
              loading={isLoading}
              disabled={!selectedPath}
            >
              Open Library
            </Button>
          </Stack>
        </Stack>
      </Sheet>
    </Modal>
  );
}
