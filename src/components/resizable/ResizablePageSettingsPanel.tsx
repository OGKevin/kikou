import React from "react";
import { Panel } from "react-resizable-panels";
import PageSettingsPanel from "@/components/pages/SettingsPanel";
import { ComicPageInfo } from "@/types/comic";

interface ResizablePageSettingsPanelProps {
  targetFile: string | null;
  currentSettings: ComicPageInfo;
  onUpdateSettings: (updates: Partial<ComicPageInfo>) => void;
  onReset: () => void;
  showSaveButton?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  errorMessage?: string | null;
  showMarkAsTocButton?: boolean;
  onMarkAsToc?: (file: string) => void;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  id?: string;
}

export default function ResizablePageSettingsPanel({
  targetFile,
  currentSettings,
  onUpdateSettings,
  onReset,
  showSaveButton = false,
  onSave,
  isSaving = false,
  errorMessage,
  showMarkAsTocButton = false,
  onMarkAsToc,
  defaultSize = 25,
  minSize = 15,
  maxSize = 60,
  collapsible = false,
  id,
}: ResizablePageSettingsPanelProps) {
  return (
    <Panel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible={collapsible}
      id={id}
    >
      <PageSettingsPanel
        targetFile={targetFile}
        currentSettings={currentSettings}
        onUpdateSettings={onUpdateSettings}
        onReset={onReset}
        showSaveButton={showSaveButton}
        onSave={onSave}
        isSaving={isSaving}
        errorMessage={errorMessage}
        showMarkAsTocButton={showMarkAsTocButton}
        onMarkAsToc={onMarkAsToc}
      />
    </Panel>
  );
}
