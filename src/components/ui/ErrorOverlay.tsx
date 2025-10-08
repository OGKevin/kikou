import React from "react";
import { ErrorResponse } from "@/types/errorResponse";
import Modal from "@mui/joy/Modal";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";

interface ErrorOverlayProps {
  error: ErrorResponse | null;
  buttons: React.ReactNode[];
}

export function ErrorOverlay({ error, buttons }: ErrorOverlayProps) {
  if (!error) return null;

  return (
    <Modal
      open={!!error}
      sx={{
        zIndex: 1300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Sheet
        variant="outlined"
        sx={{
          minWidth: 320,
          maxWidth: 400,
          borderRadius: 8,
          p: 4,
          boxShadow: "md",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography level="h2" color="danger" sx={{ mb: 2 }}>
          Error
        </Typography>
        <Typography sx={{ mb: 3 }}>{error.message}</Typography>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          {buttons.map((btn, i) => (
            <span key={i}>{btn}</span>
          ))}
        </div>
      </Sheet>
    </Modal>
  );
}
