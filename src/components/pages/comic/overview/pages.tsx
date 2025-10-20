import {
  Box,
  Sheet,
  Slider,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/joy";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useImageFiles } from "@/hooks/useImageFiles";
import { useComicInfo } from "@/hooks/useComicInfo";
import { ComicPageInfo } from "@/types/comic";
import PagePreviewPanel from "@/components/pages/PreviewPanel";
import ReadOnlyPageSettingsPanel from "@/components/pages/ReadOnlyPageSettingsPanel";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useEffect, useState, useMemo } from "react";
import { devLog } from "@/utils/devLog";
import { useBookmarkedFiles } from "@/hooks/useBookmarkedFiles";

export default function PagesTab() {
  const { imageFiles, loading, error } = useImageFiles();
  const { parsedComicInfo } = useComicInfo();
  const archive = useArchiveContext();
  const selectedPage = archive?.selectedPage ?? 0;
  const setSelectedPage = archive?.setSelectedPage ?? (() => {});
  const bookmarkedFiles = useBookmarkedFiles();

  const [uiSelectedPage, setUiSelectedPage] = useState(selectedPage);

  devLog("PagesTab render", { bookmarkedFiles, imageFiles });

  useEffect(() => {
    setUiSelectedPage(selectedPage);
  }, [selectedPage]);

  const updateSelectedPage = (v: number) => {
    setSelectedPage(v);
    setUiSelectedPage(v);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        updateSelectedPage(Math.max(0, uiSelectedPage - 1));
        e.preventDefault();
      }

      if (e.key === "ArrowRight") {
        updateSelectedPage(Math.min(imageFiles.length - 1, uiSelectedPage + 1));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageFiles.length, uiSelectedPage]);

  const marks = useMemo(
    () =>
      bookmarkedFiles
        .map((file) => imageFiles.indexOf(file))
        .filter((idx) => idx !== -1)
        .map((idx) => ({ value: idx })),
    [bookmarkedFiles, imageFiles],
  );

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="danger">Error: {error}</Typography>;
  }

  if (imageFiles.length === 0) {
    return <Typography>No images found.</Typography>;
  }

  const coverFile = imageFiles[0];
  const selectedFile = imageFiles[selectedPage];
  const pageInfo: ComicPageInfo = parsedComicInfo[selectedFile] || {
    Type: "Unknown",
    DoublePage: false,
    Bookmark: "",
    IsEmpty: () => true,
    Equals: () => false,
  };

  return (
    <Stack
      id="ComicOverviewPage-Pages-Root"
      direction="row"
      spacing={0}
      sx={{ height: "100%", width: "100%" }}
    >
      <Sheet
        variant="plain"
        sx={{
          flex: "0 0 25%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          transition: "width 0.3s",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            aspectRatio: "3/4",
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PagePreviewPanel targetFile={coverFile} targetPageNumber={"1"} />
        </Box>
      </Sheet>

      <Stack
        flex={1}
        minWidth={0}
        direction="column"
        spacing={2}
        sx={{ minHeight: 0, height: "100%" }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexShrink: 1,
            flexBasis: 0,
          }}
        >
          <PagePreviewPanel
            targetFile={selectedFile}
            targetPageNumber={String(selectedPage + 1)}
          />
        </Box>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ px: "100px" }}
        >
          <Tooltip title="Previous page (← Arrow key)" placement="top">
            <span>
              <IconButton
                variant="outlined"
                size="sm"
                onClick={() => {
                  updateSelectedPage(Math.max(0, uiSelectedPage - 1));
                }}
                disabled={uiSelectedPage === 0}
                data-testid="prev-page-button"
              >
                <ChevronLeftIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Slider
            min={0}
            max={imageFiles.length - 1}
            value={uiSelectedPage}
            marks={marks}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `Page ${v + 1}`}
            sx={{ width: "100%" }}
            onChange={(_e, v) => {
              if (typeof v === "number") {
                setUiSelectedPage(v);
              }
            }}
            onChangeCommitted={(_e, v) => {
              if (typeof v === "number") {
                updateSelectedPage(v);
              }
            }}
          />

          <Tooltip title="Next page (→ Arrow key)" placement="top">
            <span>
              <IconButton
                variant="outlined"
                size="sm"
                onClick={() => {
                  updateSelectedPage(
                    Math.min(imageFiles.length - 1, uiSelectedPage + 1),
                  );
                }}
                disabled={uiSelectedPage === imageFiles.length - 1}
                data-testid="next-page-button"
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        sx={{
          flex: "0 0 25%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          p: 0,
        }}
      >
        <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <ReadOnlyPageSettingsPanel pageInfo={pageInfo} />
          <Typography>
            Page {selectedPage + 1} / {imageFiles.length}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
