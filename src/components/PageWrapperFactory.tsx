import React from "react";
import { Box } from "@mui/joy";
import { NavigationProvider } from "@/contexts/NavigationContext";
import NavigationDialogManager from "@/components/ui/NavigationDialogManager";
import { ArchiveProvider } from "@/contexts/ArchiveContext";
import ArchiveValidator from "@/components/file/ArchiveValidator";
import Navigation from "./ui/Navigation";

interface PageWrapperFactoryProps {
  path?: string;
  pathname: string;
  content: React.ReactNode;
}

export function getPageWrapper({
  path,
  pathname,
  content,
}: PageWrapperFactoryProps) {
  const wrappedContent = (() => {
    if (pathname.startsWith("/comic/")) {
      const isXmlEdit = pathname === "/comic/edit/xml";
      const isEditIndex = pathname === "/comic/edit";

      if (isEditIndex) {
        return <ArchiveProvider path={path}>{content}</ArchiveProvider>;
      }

      return (
        <ArchiveProvider path={path}>
          <ArchiveValidator redirectToXMLEditor={!isXmlEdit}>
            {content}
          </ArchiveValidator>
        </ArchiveProvider>
      );
    }

    return content;
  })();

  return (
    <NavigationProvider>
      <NavigationDialogManager />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Navigation />
        <Box sx={{ flex: 1, overflow: "hidden" }}>{wrappedContent}</Box>
      </Box>
    </NavigationProvider>
  );
}
