import React, { useEffect } from "react";
import { Box, Typography, CircularProgress, Sheet, Alert } from "@mui/joy";
import { usePreviewCache } from "@/hooks/usePreviewCache";
import { ErrorResponse } from "@/types/errorResponse";
import ComicHeader from "@/components/pages/Header";
import { useImageZoom } from "@/hooks/useImageZoom";

interface PagePreviewPanelProps {
  targetFile: string | null;
  targetPageNumber: string;
  // Optional header and layout for ToC-like usage
  title?: string;
  buttons?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    style?: React.CSSProperties;
  }>;
  width?: number | string;
}

export default function PagePreviewPanel({
  targetFile,
  targetPageNumber,
  title,
  buttons,
  width,
}: PagePreviewPanelProps) {
  const { previewUrl, loadingPreview, error } = usePreviewCache(targetFile);

  const {
    imgRef,
    handleImgClick,
    handleMouseDown,
    getTransformStyle,
    setZoom,
    setZoomCenter,
    setOffset,
    shouldTransition,
  } = useImageZoom();

  useEffect(() => {
    setZoom(1);
    setZoomCenter(null);
    setOffset({ x: 0, y: 0 });
  }, [targetFile, setZoom, setZoomCenter, setOffset]);

  const isLoading = Boolean(loadingPreview);
  const displayedError: ErrorResponse | null = error;

  return (
    <Sheet
      variant="outlined"
      sx={{
        width: width ?? undefined,
        flex: 1,
        p: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
      }}
    >
      {title ? (
        <ComicHeader title={title} buttons={buttons ?? []} titleLevel="h2" />
      ) : (
        <Typography
          level="h4"
          sx={{
            margin: "0 0 16px 0",
            flexShrink: 0,
            textAlign: "center",
          }}
        >
          Page Preview
        </Typography>
      )}

      {isLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress size="md" />
          <Typography>Loading page...</Typography>
        </Box>
      ) : displayedError ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 2,
          }}
        >
          <Alert color="warning">{displayedError.message}</Alert>
        </Box>
      ) : targetFile && previewUrl ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <Box
            component="img"
            ref={imgRef}
            src={previewUrl}
            alt={`Page ${targetPageNumber}`}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              alignSelf: "center",
              objectFit: "contain",
              transition: shouldTransition ? "0.5s ease" : "none",
              ...getTransformStyle(),
            }}
            onClick={handleImgClick}
            onMouseDown={handleMouseDown}
          />
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography color="neutral">
            Enter a page number to preview
          </Typography>
        </Box>
      )}
    </Sheet>
  );
}
