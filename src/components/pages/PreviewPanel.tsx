import React, { useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Sheet,
  Alert,
  AspectRatio,
} from "@mui/joy";
import { usePreviewCache } from "@/hooks/usePreviewCache";
import { ErrorResponse } from "@/types/errorResponse";
import PanelTitle from "@/components/pages/PanelTitle";
import { useImageZoom } from "@/hooks/useImageZoom";

interface PagePreviewPanelProps {
  targetFile: string | null;
  targetPageNumber: string;
  // Optional header and layout for ToC-like usage
  title?: string;
  width?: number | string;
}

export default function PagePreviewPanel({
  targetFile,
  targetPageNumber,
  title,
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
      id="PagePreviewPanel"
      variant="plain"
      sx={{
        width: width ?? undefined,
        height: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {title && <PanelTitle>{title}</PanelTitle>}

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
        <AspectRatio
          objectFit="contain"
          flex={true}
          sx={{
            overflow: "hidden",
          }}
          variant="plain"
        >
          <Box
            component="img"
            ref={imgRef}
            src={previewUrl}
            alt={`Page ${targetPageNumber}`}
            sx={{
              width: "100%",
              height: "100%",
              transition: shouldTransition ? "0.5s ease" : "none",
              ...getTransformStyle(),
            }}
            onClick={handleImgClick}
            onMouseDown={handleMouseDown}
          />
        </AspectRatio>
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
