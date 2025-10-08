import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { devLog } from "@/utils/devLog";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export function useComicInfoXML(path: string) {
  const archiveContext = useArchiveContext();
  const reload = archiveContext?.reload;
  const hasUnsavedChanges = archiveContext?.hasUnsavedXmlChanges ?? false;
  const setHasUnsavedChanges = archiveContext?.setHasUnsavedXmlChanges;

  const [xml, setXml] = useState("");
  const [originalXml, setOriginalXml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wasInitiallyEmpty, setWasInitiallyEmpty] = useState(false);

  const savedDataKey = `xmlSavedData_${path}`;
  const getHasSavedData = useCallback(() => {
    if (typeof window === "undefined") return false;

    return sessionStorage.getItem(savedDataKey) === "true";
  }, [savedDataKey]);
  const setHasSavedData = useCallback(
    (value: boolean) => {
      if (typeof window !== "undefined") {
        if (value) {
          sessionStorage.setItem(savedDataKey, "true");
        } else {
          sessionStorage.removeItem(savedDataKey);
        }
      }
    },
    [savedDataKey],
  );

  // Validation state
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  // Update context when xml or originalXml changes
  useEffect(() => {
    const hasChanges = xml !== originalXml;

    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(hasChanges);
    }
  }, [xml, originalXml, setHasUnsavedChanges]);

  // Load XML from file
  useEffect(() => {
    if (!path) return;

    setLoading(true);
    invoke<string | null>("get_raw_comicinfo_xml", { path })
      .then(async (result: string | null) => {
        const xmlContent = result || "";

        setXml(xmlContent);
        setOriginalXml(xmlContent);
        setLoading(false);
      })
      .catch((e: Error) => {
        devLog("failed to get raw comicinfo.xml: " + e);
        setError("Failed to get raw ComicInfo.xml");
        setLoading(false);
      });
  }, [path]);

  // Check if initially empty
  useEffect(() => {
    if (!loading && originalXml === "" && xml === "") {
      setWasInitiallyEmpty(true);
    }
  }, [loading, originalXml, xml]);

  const validateXml = useCallback(
    async (xmlContent?: string) => {
      const contentToValidate = xmlContent || xml;

      if (!contentToValidate.trim()) {
        setIsValid(false);
        setIsValidating(false);
        setValidationMessage("XML content is empty");
        return;
      }

      if (isValidating) return;

      setIsValidating(true);

      try {
        await invoke("validate_comicinfo_xml", { xml: contentToValidate });
        setIsValid(true);
        setIsValidating(false);
        setValidationMessage("Valid ComicInfo.xml");
      } catch (e: unknown) {
        setIsValid(false);
        setIsValidating(false);
        setValidationMessage(e instanceof Error ? e.message : String(e));
      }
    },
    [xml, isValidating],
  );

  const clearValidation = useCallback(() => {
    setIsValidating(false);
    setValidationMessage(null);
    setIsSaving(false);
  }, []);

  const saveXml = useCallback(
    async (onSaveSuccess?: (xml: string) => void) => {
      if (!path) {
        console.error("Path is required for saving XML");
        return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const savedXml = await invoke<string>("save_comicinfo_xml", {
          path,
          xml,
        });

        setOriginalXml(savedXml);
        setXml(savedXml);
        setIsValid(true);
        setIsSaving(false);
        setValidationMessage("Valid ComicInfo.xml");
        devLog("ComicInfo.xml saved successfully");
        setHasSavedData(true);

        if (onSaveSuccess) {
          onSaveSuccess(xml);
        }

        return true;
      } catch (e: unknown) {
        setIsValid(false);
        setIsSaving(false);
        setValidationMessage(null);
        setError(
          "Failed to save XML: " + (e instanceof Error ? e.message : String(e)),
        );
        return false;
      }
    },
    [xml, path, setHasSavedData],
  );

  const resetXml = useCallback(() => {
    setXml(originalXml);
    setError(null);
  }, [originalXml]);

  const formatXml = useCallback(async (): Promise<boolean> => {
    if (!xml.trim()) return false;

    setIsSaving(true);
    setError(null);

    try {
      const formattedXml = await invoke<string>("format_comicinfo_xml", {
        xml,
      });

      setXml(formattedXml);
      devLog("ComicInfo.xml formatted successfully");
      return true;
    } catch (e: unknown) {
      setError("Failed to format ComicInfo.xml");
      console.error("Failed to format ComicInfo.xml:", e);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [xml]);

  const deleteXml = useCallback(async (): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);

    try {
      await invoke("delete_cbz_comicinfo_xml", { path });
      setXml("");
      setOriginalXml("");
      return true;
    } catch {
      setError("Failed to delete ComicInfo.xml");
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [path]);

  const onTabLoseFocus = useCallback(() => {
    const hasSavedData = getHasSavedData();

    devLog(
      "XML tab lost focus, checking for unsaved changes",
      hasSavedData,
      reload !== undefined,
    );

    if (hasSavedData && reload) {
      reload();
      setHasSavedData(false);
    }
  }, [reload, getHasSavedData, setHasSavedData]);

  return {
    clearValidation,
    deleteXml,
    error,
    formatXml,
    hasUnsavedChanges,
    isDeleting,
    isSaving,
    isValid,
    isValidating,
    loading,
    onTabLoseFocus,
    originalXml,
    resetXml,
    saveXml,
    setXml,
    validateXml,
    validationMessage,
    wasInitiallyEmpty,
    xml,
  };
}
