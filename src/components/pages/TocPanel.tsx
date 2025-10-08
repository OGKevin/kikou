import React from "react";
import { Box, Sheet } from "@mui/joy";
import ComicHeader from "@/components/pages/Header";

interface TocPreviewPanelProps {
  title: string;
  buttons: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
    style?: React.CSSProperties;
  }>;
  tocFile: string | null;
  previewCache: Record<string, number[]>;
  createImageUrl: (data: number[]) => string;
}

export default function TocPreviewPanel({
  title,
  buttons,
  tocFile,
  previewCache,
  createImageUrl,
}: TocPreviewPanelProps) {
  return (
    <Sheet
      variant="outlined"
      sx={{
        width: 400,
        p: 2.5,
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ComicHeader title={title} buttons={buttons} titleLevel="h2" />
      {tocFile && previewCache[tocFile] && (
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
            src={createImageUrl(previewCache[tocFile])}
            alt="Table of Contents"
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </Box>
      )}
    </Sheet>
  );
}
