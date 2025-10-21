import React from "react";
import { Box, Typography } from "@mui/joy";

interface PanelTitleProps {
  children: React.ReactNode;
  level?: "h1" | "h2" | "h3" | "h4";
  sx?: object;
}

export default function PanelTitle({
  children,
  level = "h3",
  sx = {},
}: PanelTitleProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.surface",
        textAlign: "center",
        ...sx,
      }}
      data-testid="panel-title"
    >
      <Typography
        level={level}
        fontSize="1.25rem"
        data-testid="panel-title-text"
      >
        {children}
      </Typography>
    </Box>
  );
}
