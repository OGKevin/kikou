import { Box, Sheet, Slider, Typography, Stack } from "@mui/joy";
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedPage((prev) => Math.max(0, prev - 1));
        setUiSelectedPage((prev) => Math.max(0, prev - 1));
        e.preventDefault();
      }

      if (e.key === "ArrowRight") {
        setSelectedPage((prev) => Math.min(imageFiles.length - 1, prev + 1));
        setUiSelectedPage((prev) => Math.min(imageFiles.length - 1, prev + 1));
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [imageFiles.length, setSelectedPage]);

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
        <Box sx={{ px: "100px" }}>
          <Slider
            min={0}
            max={imageFiles.length - 1}
            value={uiSelectedPage}
            onChange={(_e, v) => {
              setUiSelectedPage(v as number);
            }}
            onChangeCommitted={(_e, v) => setSelectedPage(v as number)}
            marks={marks}
            valueLabelDisplay="auto"
          />
        </Box>
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
