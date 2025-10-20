import React, { useState, useCallback, useEffect, useRef } from "react";
import { useStreamPreviews } from "@/hooks/useStreamPreviews";
import LoadingOverlay from "@/components/ui/LoadingOverlay";

const HIDE_DELAY_MS = 2000;

export interface PagesLoadingOverlayProps {
  fileNames: string[];
}

export function PagesLoadingOverlay({ fileNames }: PagesLoadingOverlayProps) {
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStart = useCallback(() => {
    setIsStreaming(true);
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
    onFinish: handleFinish,
  });

  if (fileNames.length === 0) {
    return null;
  }

  return <LoadingOverlay isVisible={isStreaming} message="Loading Pages..." />;
}
