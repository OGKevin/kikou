import { useRouter } from "next/router";
import { useEffect, useState, useCallback } from "react";
import { Box, Alert, LinearProgress } from "@mui/joy";
import * as React from "react";

import LoadingOverlay from "../../../components/ui/LoadingOverlay";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import EditTab from "../../../components/tabs/EditTab";
import TocTab from "../../../components/tabs/TocTab";
import XmlTab from "../../../components/tabs/XmlTab";
import { useStorageManager } from "../../../hooks/useStorageManager";
import { useImageFiles } from "../../../hooks/useImageFiles";
import { useComicInfoXML } from "../../../hooks/useComicInfoXML";
import {
  PageSettingsProvider,
  usePageSettingsContext,
} from "../../../contexts/PageSettingsContext";
import { useNavigationContext } from "../../../contexts/NavigationContext";
import { useArchiveContext } from "../../../contexts/ArchiveContext";
import { devLog } from "../../../utils/devLog";

const TOC_ALERT_DURATION = 5000;

export default function EditPageInfoV2Page() {
  const router = useRouter();
  const path = router.query.path as string;
  const tab = router.query.tab as string;
  const storageManager = useStorageManager(path);

  if (!path) {
    return null;
  }

  return (
    <PageSettingsProvider path={path} storageManager={storageManager}>
      <EditPageInfoV2Content initialTab={tab || "edit"} />
    </PageSettingsProvider>
  );
}

function EditPageInfoV2Content({ initialTab }: { initialTab: string }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const router = useRouter();
  const sessionTabKey = "editPageInfoV2.selectedTab";
  const getInitialTab = () => {
    const storedTab =
      typeof window !== "undefined"
        ? sessionStorage.getItem(sessionTabKey)
        : null;

    return storedTab || initialTab;
  };
  const [, setSelectedFile] = useState<string | null>(null);
  const [showTocAlert, setShowTocAlert] = useState(false);
  const [tocAlertProgress, setTocAlertProgress] = useState(100);

  const path = router.query.path as string;

  // XML-related hooks
  const xmlOps = useComicInfoXML(path);
  const { validateXml } = xmlOps;

  const { isSaving } = usePageSettingsContext();

  const storageManager = useStorageManager(path);
  const {
    imageFiles,
    loading: loadingImages,
    error: imagesError,
  } = useImageFiles();

  const { setTabs, currentTab, setCurrentTab, setOnTabChange } =
    useNavigationContext();
  const { tocFile } = useArchiveContext() ?? {};
  const hasUnsavedXmlChanges = xmlOps.hasUnsavedChanges;

  const handleTabChange = useCallback(
    (
      _event: React.SyntheticEvent | null, // MUI tabs pass this but we don't need it
      newValue: string | number | null,
    ) => {
      const tabValue = newValue as string;

      // Prevent switching away from XML tab if there are unsaved changes
      if (
        currentTab === "xml" &&
        xmlOps.hasUnsavedChanges &&
        tabValue !== "xml"
      ) {
        return;
      }

      // Call onTabLoseFocus when leaving the XML tab
      if (currentTab === "xml" && tabValue !== "xml" && xmlOps.onTabLoseFocus) {
        xmlOps.onTabLoseFocus();
      }

      setCurrentTab(tabValue);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(sessionTabKey, tabValue);
      }

      // Update URL without navigation
      const newUrl = `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(path)}&tab=${tabValue}`;

      window.history.replaceState(null, "", newUrl);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [
      currentTab,
      xmlOps.hasUnsavedChanges,
      xmlOps.onTabLoseFocus,
      setCurrentTab,
      sessionTabKey,
      path,
    ],
  );

  useEffect(() => {
    // Set up the navigation tabs for this page
    const isXmlTab = currentTab === "xml";

    setTabs([
      {
        label: "Edit",
        value: "edit",
        disabled: isXmlTab && hasUnsavedXmlChanges,
        tooltip:
          isXmlTab && hasUnsavedXmlChanges
            ? "Save or discard XML changes before switching tabs."
            : undefined,
      },
      {
        label: "ToC",
        value: "toc",
        disabled: !tocFile || (isXmlTab && hasUnsavedXmlChanges),
        tooltip: !tocFile
          ? "You must mark a file as ToC to enable this tab."
          : isXmlTab && hasUnsavedXmlChanges
            ? "Save or discard XML changes before switching tabs."
            : undefined,
      },
      {
        label: "XML",
        value: "xml",
        disabled: false,
      },
    ]);
  }, [setTabs, tocFile, hasUnsavedXmlChanges, currentTab]);

  // Separate useEffect for initial setup to avoid infinite loops
  useEffect(() => {
    // Set initial tab if not already set
    if (!currentTab) {
      setCurrentTab(getInitialTab());
    }

    // Clean up tabs on unmount only
    return () => {
      setTabs([]);
      setCurrentTab(null);
      setOnTabChange(() => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  // Register tab change handler whenever it changes
  useEffect(() => {
    setOnTabChange(() => handleTabChange);
  }, [handleTabChange, setOnTabChange]);

  useEffect(() => {
    const queryPath = router.query.path as string;

    if (storageManager) {
      const selectedFile = storageManager.getSelectedFile();

      if (selectedFile) {
        setSelectedFile(selectedFile);
      }
    }

    if (!queryPath) {
      router.push("/comic/edit");
    }
  }, [router, storageManager]);

  useEffect(() => {
    if (imageFiles.length > 0) {
      setSelectedFile((current) => {
        devLog("Current selected file:", current);

        if (current && imageFiles.includes(current)) {
          return current;
        }

        const storedSelectedFile = storageManager?.getSelectedFile();

        if (storedSelectedFile && imageFiles.includes(storedSelectedFile)) {
          return storedSelectedFile;
        }

        return imageFiles.length > 0 ? imageFiles[0] : null;
      });
    }
  }, [imageFiles, storageManager]);

  // Initialize XML validation when XML tab is loaded
  useEffect(() => {
    if (
      currentTab === "xml" &&
      !xmlOps.loading &&
      xmlOps.originalXml &&
      xmlOps.xml === xmlOps.originalXml &&
      xmlOps.xml.trim()
    ) {
      validateXml();
    }
  }, [currentTab, xmlOps.xml, validateXml, xmlOps.loading, xmlOps.originalXml]);

  useEffect(() => {
    if (!showTocAlert) return;

    const start = Date.now();
    let frameId: number;

    const animate = () => {
      const elapsed = Date.now() - start;
      const value = Math.max(0, 100 - (elapsed / TOC_ALERT_DURATION) * 100);

      setTocAlertProgress(value);

      if (elapsed < TOC_ALERT_DURATION) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    const timer = setTimeout(() => {
      setShowTocAlert(false);
      setTocAlertProgress(100);
      cancelAnimationFrame(frameId);
    }, TOC_ALERT_DURATION);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frameId);
    };
  }, [showTocAlert]);

  if (loadingImages) {
    return <LoadingSpinner />;
  }

  if (imagesError) {
    return <div>Error: {imagesError}</div>;
  }

  if (!storageManager) {
    return <div>Loading storage manager...</div>;
  }

  return (
    <Box
      sx={{
        backgroundColor: "background.level1",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {showTocAlert && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            zIndex: 1200,
          }}
        >
          <Alert color="danger" variant="soft" sx={{ borderRadius: 0 }}>
            Please mark a file as ToC to use the Table of Contents tab.
          </Alert>
          <LinearProgress
            determinate
            variant="plain"
            color="danger"
            value={tocAlertProgress}
          />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {currentTab === "edit" && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <EditTab storageManager={storageManager} />
          </Box>
        )}
        {currentTab === "toc" && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <TocTab />
          </Box>
        )}
        {currentTab === "xml" && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <XmlTab />
          </Box>
        )}
        {!currentTab && (
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <EditTab storageManager={storageManager} />
          </Box>
        )}
      </Box>

      <LoadingOverlay isVisible={isSaving} message="Saving comic archive..." />
    </Box>
  );
}
