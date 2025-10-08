import React from "react";
import { Box, Button, Typography, Stack } from "@mui/joy";
import { useNavigationContext } from "@/contexts/NavigationContext";

export default function NavigationDialogManager() {
  const { showClearDialog, closeClearDialog } = useNavigationContext();

  if (!showClearDialog) return null;

  function handleConfirm() {
    localStorage.clear();
    window.location.reload();
  }

  return (
    <Box
      data-testid="clear-storage-overlay"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        bgcolor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          bgcolor: "background.surface",
          p: 4,
          borderRadius: 2,
          boxShadow: 4,
          minWidth: 320,
          textAlign: "center",
        }}
      >
        <Typography level="h4" color="danger" sx={{ mb: 2 }}>
          Clear Cache
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Are you sure you want to clear the cache? This action cannot be
          undone.
          <br />
          All unsaved data will be lost.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            color="danger"
            variant="solid"
            size="lg"
            onClick={handleConfirm}
            sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
          >
            Clear
          </Button>
          <Button
            color="neutral"
            variant="outlined"
            size="lg"
            onClick={closeClearDialog}
            sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
