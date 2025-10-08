import { useRef, useState, useEffect, useCallback } from "react";

export function useImageZoom({
  onZoomReset,
}: { onZoomReset?: () => void } = {}) {
  const [zoom, setZoom] = useState(1);
  const [zoomCenter, setZoomCenter] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const imgRef = useRef<HTMLImageElement>(null);
  const draggedRef = useRef(false);

  // Click to zoom handler
  const handleImgClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (draggedRef.current) {
        draggedRef.current = false;
        return;
      }

      if (zoom === 1) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setZoom(2);
        setZoomCenter({ x, y });
      } else {
        setZoom(1);
        setZoomCenter(null);

        if (onZoomReset) onZoomReset();
      }
    },
    [zoom, onZoomReset],
  );

  // Drag logic
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (zoom === 1) return;

      e.preventDefault();
      setDragging(true);
      draggedRef.current = false;
      const startX = e.clientX;
      const startY = e.clientY;
      const startOffset = { ...offset };
      const handleMouseMove = (moveEvent: MouseEvent) => {
        draggedRef.current = true;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        const newOffset = {
          x: startOffset.x + dx,
          y: startOffset.y + dy,
        };

        if (imgRef.current) {
          const x = zoomCenter ? zoomCenter.x * 100 : 50;
          const y = zoomCenter ? zoomCenter.y * 100 : 50;

          imgRef.current.style.transform = `scale(${zoom}) translate(${newOffset.x / zoom}px, ${newOffset.y / zoom}px)`;
          imgRef.current.style.transformOrigin = `${x}% ${y}%`;
          imgRef.current.style.cursor = "grabbing";
        }
      };
      const handleMouseUp = (upEvent: MouseEvent) => {
        const dx = upEvent.clientX - startX;
        const dy = upEvent.clientY - startY;
        const finalOffset = {
          x: startOffset.x + dx,
          y: startOffset.y + dy,
        };

        setOffset(finalOffset);
        setDragging(false);

        if (imgRef.current) {
          imgRef.current.style.cursor = "grab";
        }

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [zoom, zoomCenter, offset],
  );

  // Reset offset and cleanup inline styles on zoom reset
  useEffect(() => {
    setOffset({ x: 0, y: 0 });

    if (imgRef.current && zoom === 1) {
      imgRef.current.style.transform = "";
      imgRef.current.style.transformOrigin = "";
      imgRef.current.style.cursor = "";
    }
  }, [zoom]);

  // Calculate transform style and origin
  const getTransformStyle = useCallback(() => {
    if (zoom === 1) {
      return {
        transform: "scale(1)",
        transformOrigin: "center center",
        cursor: "pointer",
      };
    }

    if (!zoomCenter) {
      return {
        transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
        transformOrigin: "center center",
        cursor: dragging ? "grabbing" : "grab",
      };
    }

    const x = zoomCenter.x * 100;
    const y = zoomCenter.y * 100;

    return {
      transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
      transformOrigin: `${x}% ${y}%`,
      cursor: dragging ? "grabbing" : "grab",
    };
  }, [zoom, zoomCenter, offset, dragging]);

  const shouldTransition = !dragging;

  return {
    imgRef,
    zoom,
    zoomCenter,
    dragging,
    offset,
    handleImgClick,
    handleMouseDown,
    getTransformStyle,
    setZoom,
    setZoomCenter,
    setOffset,
    shouldTransition,
  };
}
