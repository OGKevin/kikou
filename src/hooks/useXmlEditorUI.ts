import { useState } from "react";

export function useXmlEditorUI() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const showSuccessMessage = (type: "save" | "format" | "delete") => {
    switch (type) {
      case "save":
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        break;
      case "format":
        setFormatSuccess(true);
        setTimeout(() => setFormatSuccess(false), 3000);
        break;
      case "delete":
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
        break;
    }
  };

  const clearAllMessages = () => {
    setSaveSuccess(false);
    setFormatSuccess(false);
    setDeleteSuccess(false);
  };

  return {
    saveSuccess,
    formatSuccess,
    deleteSuccess,
    deleteDialogOpen,
    setDeleteDialogOpen,
    showSuccessMessage,
    clearAllMessages,
  };
}
