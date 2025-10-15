import React, { useState, useCallback, useEffect, useRef } from "react";
import { LinearProgress, Typography, Box } from "@mui/joy";
import { useStreamPreviews } from "@/hooks/useStreamPreviews";

const HIDE_DELAY_MS = 2000;

export interface StreamingProgressBarProps {
  fileNames: string[];
}

export function StreamingProgressBar({ fileNames }: StreamingProgressBarProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState({
    loaded: 0,
    total: fileNames.length,
  });

  const handleStart = useCallback(() => {
    setIsStreaming(true);
  }, []);

  const handleProgress = useCallback((loaded: number, total: number) => {
    setProgress({ loaded, total });
  }, []);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFinish = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsStreaming(false), HIDE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useStreamPreviews({
    fileNames,
    onStart: handleStart,
    onProgress: handleProgress,
    onFinish: handleFinish,
  });

  if (!isStreaming || fileNames.length === 0) {
    return null;
  }

  const percentage = Math.round((progress.loaded / progress.total) * 100);

  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress
        determinate
        variant="soft"
        color={percentage === 100 ? "primary" : "neutral"}
        size="sm"
        thickness={24}
        value={percentage}
      >
        <Typography
          level="body-xs"
          textColor="common.white"
          sx={{ fontWeight: "xl", mixBlendMode: "difference" }}
        >
          Loading Pages ({progress.loaded}/{progress.total})
        </Typography>
      </LinearProgress>
    </Box>
  );
}
