import React from "react";
import { Box, CircularProgress, Typography } from "@mui/joy";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        gap: 2,
      }}
    >
      <CircularProgress size="lg" />
      {message && (
        <Typography level="body-md" color="neutral">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
