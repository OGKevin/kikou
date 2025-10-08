import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/joy";
import XmlEditor from "../../../components/tabs/XmlEditor";
import { useComicInfoXML } from "../../../hooks/useComicInfoXML";
import LoadingOverlay from "../../../components/ui/LoadingOverlay";

export default function ComicEditXmlPage() {
  const router = useRouter();
  const path = router.query.path as string;

  if (!path) {
    return null;
  }

  return <ComicEditXmlContent />;
}

function ComicEditXmlContent() {
  const router = useRouter();
  const path = router.query.path as string;
  const [redirecting, setRedirecting] = useState(false);

  // Use our custom hooks
  const xmlOps = useComicInfoXML(path);
  const { validateXml } = xmlOps;

  useEffect(() => {
    if (
      !xmlOps.loading &&
      xmlOps.originalXml &&
      xmlOps.xml === xmlOps.originalXml &&
      xmlOps.xml.trim()
    ) {
      validateXml();
    }
  }, [xmlOps.xml, validateXml, xmlOps.loading, xmlOps.originalXml]);

  if (xmlOps.loading) return <Typography>Loading...</Typography>;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <LoadingOverlay isVisible={redirecting} message="Redirecting..." />

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <XmlEditor
          onAfterSave={() => {
            setRedirecting(true);
            setTimeout(() => {
              window.location.replace(
                `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(path)}&tab=xml`,
              );
            }, 1000);
          }}
          onAfterDelete={() => {
            setRedirecting(true);
            setTimeout(() => {
              window.location.replace(
                `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(path)}&tab=xml`,
              );
            }, 1000);
          }}
        />
      </Box>
    </Box>
  );
}
