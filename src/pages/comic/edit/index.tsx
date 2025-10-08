"use client";

import { open } from "@tauri-apps/plugin-dialog";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  RecentComicFilesProvider,
  useRecentComicFiles,
} from "../../../contexts/RecentComicFilesContext";
import RecentComicFiles from "../../../components/drawers/RecentComicFiles";
import {
  Box,
  Button,
  Typography,
  Stack,
  Card,
  CircularProgress,
  Alert,
} from "@mui/joy";

export default function Page() {
  return (
    <RecentComicFilesProvider>
      <PageContent />
    </RecentComicFilesProvider>
  );
}

function PageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addRecentFile } = useRecentComicFiles();

  const handlePickFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "CBZ Files",
            extensions: ["cbz"],
          },
        ],
      });

      if (selected) {
        addRecentFile(selected);
        router.push(
          `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(selected)}&tab=edit`,
        );
      }
    } catch {
      setError("Failed to open file");
    } finally {
      setLoading(false);
    }
  };

  const handleRecentFileSelect = async (path: string) => {
    setError(null);
    addRecentFile(path);
    router.push(
      `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(path)}&tab=edit`,
    );
  };

  return (
    <>
      {error && <Alert color="danger">{error}</Alert>}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 60px)",
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
          <Stack spacing={3}>
            <Typography level="h1" fontSize="2.5rem" fontWeight="bold">
              Comic Tagger
            </Typography>
            <Typography level="body-lg" color="neutral">
              Select a .cbz file to start tagging your comics.
            </Typography>

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size="md" />
              </Box>
            ) : (
              <Stack spacing={2}>
                <Button
                  onClick={handlePickFile}
                  size="lg"
                  variant="solid"
                  color="primary"
                >
                  Pick a .cbz file
                </Button>

                <RecentComicFiles onFileSelect={handleRecentFileSelect} />
              </Stack>
            )}
          </Stack>
        </Card>
      </Box>
    </>
  );
}
