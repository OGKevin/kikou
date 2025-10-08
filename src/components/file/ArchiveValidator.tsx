import { ReactNode } from "react";
import { useRouter } from "next/router";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useArchiveValidation } from "@/hooks/useArchiveValidation";
import { ErrorResponse } from "@/types/errorResponse";
import { ErrorOverlay } from "../ui/ErrorOverlay";
import Button from "@mui/joy/Button";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { devLog } from "@/utils/devLog";

interface ArchiveValidatorProps {
  children: ReactNode;
  redirectToXMLEditor?: boolean;
  fallbackMessage?: string;
}

export default function ArchiveValidator({
  children,
  redirectToXMLEditor,
  fallbackMessage = "Loading archive...",
}: ArchiveValidatorProps) {
  const { isValidArchive, isValidXml, isLoading, error } =
    useArchiveValidation();
  const router = useRouter();
  const archive = useArchiveContext();

  if (!archive) {
    throw new Error("ArchiveValidator must be used within an ArchiveProvider");
  }

  if (isLoading) {
    return <LoadingSpinner message={fallbackMessage} />;
  }

  if (isValidArchive === false) {
    return (
      <ErrorOverlay
        error={error}
        buttons={[
          <Button key="home" onClick={() => router.push("/comic/edit")}>
            Go Home
          </Button>,
          <Button key="reload" onClick={archive.reload}>
            Reload
          </Button>,
        ]}
      />
    );
  }

  if (isValidXml === false && redirectToXMLEditor) {
    devLog(
      "ArchiveValidator: Redirecting to XML editor due to invalid or missing ComicInfo.xml",
    );
    console.log("ArchiveValidator: error object:", archive.error);

    return (
      <ErrorOverlay
        error={archive.error}
        buttons={[
          <Button
            key="xml"
            onClick={() =>
              router.push(
                `/comic/edit/xml?path=${encodeURIComponent(archive.path ?? "")}`,
              )
            }
          >
            Go to XML Editor
          </Button>,
          <Button key="home" onClick={() => router.push("/comic/edit")}>
            Go Home
          </Button>,
          <Button key="reload" onClick={archive.reload}>
            Reload
          </Button>,
        ]}
      />
    );
  }

  if (error) {
    const err = error as ErrorResponse;

    return (
      <ErrorOverlay
        error={err}
        buttons={[
          <Button key="home" onClick={() => router.push("/comic/edit")}>
            Go Home
          </Button>,
          <Button key="reload" onClick={archive.reload}>
            Reload
          </Button>,
        ]}
      />
    );
  }

  if (!archive.path && isValidArchive === null) {
    console.error(
      "ArchiveValidator: Missing archive path and archive validation is null.",
    );
    return null;
  }

  return <>{children}</>;
}
