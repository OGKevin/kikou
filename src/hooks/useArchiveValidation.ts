import { useState, useEffect } from "react";
import { devLog } from "@/utils/devLog";
import { ErrorResponse, ErrorResponseType } from "@/types/errorResponse";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { watchForArchiveCreation } from "@/api/watchForArchiveCreation";

interface ArchiveValidationResult {
  isValidArchive: boolean | null;
  isValidXml: boolean | null;
  isLoading: boolean;
  error: ErrorResponse | null;
}

export function useArchiveValidation(): ArchiveValidationResult {
  const [isValidArchive, setIsValidArchive] = useState<boolean | null>(null);
  const [isValidXml, setIsValidXml] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorResponse | null>(null);

  const archive = useArchiveContext();

  if (!archive) {
    throw new Error(
      "useArchiveValidation must be used within an ArchiveProvider",
    );
  }

  useEffect(() => {
    if (!archive.path) {
      setIsValidArchive(null);
      setIsValidXml(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(archive.loading);

    if (archive.loading) return;

    const res = archive.result;

    if (
      archive.error &&
      archive.error.error_type === ErrorResponseType.FailedToLoadArchive
    ) {
      setError(archive.error as ErrorResponse);
      // Send request to watch for creation
      watchForArchiveCreation(archive.path).catch((err) => {
        devLog("Failed to start watch for archive creation: " + String(err));
      });
      setIsValidArchive(false);
      setIsValidXml(false);
      setIsLoading(false);
      return;
    }

    if (
      res &&
      res.error &&
      (res.error.error_type === ErrorResponseType.FailedToParseComicInfoXml ||
        res.error.error_type === ErrorResponseType.ComicInfoXmlInvalid)
    ) {
      const msg =
        (res.error && res.error.message) ||
        "ComicInfo.xml is invalid or missing";

      devLog("Archive has invalid or missing ComicInfo.xml: " + msg);

      setIsValidArchive(true);
      setIsValidXml(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (archive.error) {
      setError(archive.error);
      setIsValidArchive(false);
      setIsValidXml(false);
      setIsLoading(false);
      return;
    }

    if (res) {
      devLog("Archive loaded and XML is valid (from context)");
      setIsValidArchive(true);
      setIsValidXml(true);
      setError(null);
      setIsLoading(false);
      return;
    }
  }, [archive.result, archive.error, archive.loading, archive.path]);

  return { isValidArchive, isValidXml, isLoading, error };
}
