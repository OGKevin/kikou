"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Card,
  Alert,
  Stack,
} from "@mui/joy";
import { useResetNavigation } from "@/hooks/useResetNavigation";
import { useLibrary } from "@/hooks/useLibrary";
import { useTableColumns } from "@/hooks/useTableColumns";
import { BooksTable } from "@/components/BooksTable";
import { OpenLibraryDialog } from "@/components/OpenLibraryDialog";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

export default function HomePage() {
  const [openLibraryDialogOpen, setOpenLibraryDialogOpen] = useState(false);

  const {
    books,
    isLoading,
    error,
    libraryPath,
    openLibrary,
    isLibraryOpen,
  } = useLibrary();

  const {
    columns,
    toggleColumnVisibility,
    reorderColumns,
    resetColumns,
  } = useTableColumns();

  useResetNavigation();

  const handleOpenLibrary = async (path: string) => {
    await openLibrary(path);
  };

  // Show empty state when no library path is known
  if (!libraryPath) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: 3,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            maxWidth: 600,
            width: "100%",
            padding: 4,
            textAlign: "center",
          }}
        >
          <Typography level="h1" fontSize="2.5rem" fontWeight="bold">
            Kikou
          </Typography>
          <Typography level="body-md" sx={{ mt: 2, mb: 3 }}>
            Welcome to Kikou. Start by opening a Calibre library to view and
            manage your books.
          </Typography>
          <Stack spacing={2} sx={{ mt: 4 }}>
            <Button
              onClick={() => setOpenLibraryDialogOpen(true)}
              size="lg"
              variant="solid"
              color="primary"
            >
              Open Library
            </Button>
          </Stack>
        </Card>

        <OpenLibraryDialog
          open={openLibraryDialogOpen}
          onClose={() => setOpenLibraryDialogOpen(false)}
          onLibrarySelected={handleOpenLibrary}
          isLoading={isLoading}
        />
      </Box>
    );
  }

  // Show library view (even while loading or if there's an error)
  return (
    <>
      <LoadingOverlay
        isVisible={isLoading}
        message={
          isLibraryOpen && books.length === 0
            ? "Loading books..."
            : "Opening library..."
        }
      />

      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Stack spacing={2} sx={{ mb: 3, flexShrink: 0, px: 3, pt: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography level="h1">Library</Typography>
            <Button
              onClick={() => setOpenLibraryDialogOpen(true)}
              variant="outlined"
              color="neutral"
              size="sm"
            >
              Change Library
            </Button>
          </Box>

          {libraryPath && (
            <Typography level="body-sm" sx={{ color: "neutral" }}>
              Location: {libraryPath}
            </Typography>
          )}
        </Stack>

        {error && (
          <Alert color="danger" variant="soft" sx={{ mb: 2, mx: 3, flexShrink: 0 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <BooksTable
            books={books}
            columns={columns}
            onToggleColumnVisibility={toggleColumnVisibility}
            onReorderColumns={reorderColumns}
            onResetColumns={resetColumns}
            isLoading={isLoading}
            error={error}
          />
        </Box>

        <OpenLibraryDialog
          open={openLibraryDialogOpen}
          onClose={() => setOpenLibraryDialogOpen(false)}
          onLibrarySelected={handleOpenLibrary}
          isLoading={isLoading}
        />
      </Box>
    </>
  );
}
