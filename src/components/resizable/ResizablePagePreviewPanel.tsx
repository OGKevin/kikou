import React from "react";
import { Panel } from "react-resizable-panels";
import PagePreviewPanel from "@/components/pages/PreviewPanel";

interface ResizablePagePreviewPanelProps {
  targetFile: string | null;
  targetPageNumber: string;
  title?: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  id?: string;
}

export default function ResizablePagePreviewPanel({
  targetFile,
  targetPageNumber,
  title,
  defaultSize = 33,
  minSize = 20,
  maxSize = 80,
  collapsible = false,
  id,
}: ResizablePagePreviewPanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      id={id}
    >
      <PagePreviewPanel
        targetFile={targetFile}
        targetPageNumber={targetPageNumber}
        title={title}
      />
    </Panel>
  );
}
