import React from "react";
import { Box, CircularProgress, Typography, Modal } from "@mui/joy";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Saving...",
}) => {
  return (
    <Modal open={isVisible}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size="lg" />
        <Typography
          level="body-lg"
          sx={{
            color: "white",
            textAlign: "center",
          }}
        >
          {message}
        </Typography>
      </Box>
    </Modal>
  );
};

export default LoadingOverlay;
