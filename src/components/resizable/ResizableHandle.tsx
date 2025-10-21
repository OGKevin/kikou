import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import { Box } from "@mui/joy";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface ResizableHandleProps {
  vertical?: boolean;
  withIcon?: boolean;
  id?: string;
}

export default function ResizableHandle({
  vertical = false,
  withIcon = true,
  id,
}: ResizableHandleProps) {
  return (
    <PanelResizeHandle className="resize-handle" id={id}>
      <Box
        sx={{
          width: vertical ? "100%" : 16,
          height: vertical ? 16 : "100%",
          backgroundColor: "rgba(0, 0, 0, 0.1)",
          cursor: vertical ? "row-resize" : "col-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background-color 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          },
          "&:active": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
        }}
      >
        {withIcon && (
          <DragIndicatorIcon
            sx={{
              transform: vertical ? "rotate(90deg)" : "none",
              fontSize: 20,
              color: "text.secondary",
              opacity: 0.7,
            }}
          />
        )}
      </Box>
    </PanelResizeHandle>
  );
}
