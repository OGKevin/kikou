import { useEffect } from "react";
import { Box, TabPanel, Tabs, Typography } from "@mui/joy";
import { useImageFiles } from "@/hooks/useImageFiles";
import { useNavigationContext } from "@/contexts/NavigationContext";
import InfoTab from "../../components/pages/comic/overview/info";
import PagesTab from "../../components/pages/comic/overview/pages";

export default function ComicOverviewPage() {
  const { imageFiles, loading, error } = useImageFiles();
  const { setTabs, currentTab, setCurrentTab, setOnTabChange } =
    useNavigationContext();

  useEffect(() => {
    setCurrentTab("info");
  }, [setCurrentTab]);

  useEffect(() => {
    setTabs([
      { label: "Info", value: "info" },
      { label: "Pages", value: "pages" },
    ]);
    setOnTabChange(() => (_e, v) => {
      setCurrentTab(v as string);
    });

    return () => {};
  }, [setTabs, setCurrentTab, setOnTabChange]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="danger">Error: {error}</Typography>;
  }

  if (imageFiles.length === 0) {
    return <Typography>No images found.</Typography>;
  }

  return (
    <Box
      id="ComicOverviewPage"
      sx={{
        height: "100%",
        width: "100%",
      }}
    >
      <Tabs
        value={currentTab}
        onChange={(_e, v) => setCurrentTab(v as string)}
        sx={{
          height: "100%",
          width: "100%",
        }}
      >
        <TabPanel value="info" sx={{ height: "100%", width: "100%" }}>
          <InfoTab />
        </TabPanel>
        <TabPanel value="pages" sx={{ height: "100%", width: "100%" }}>
          <PagesTab />
        </TabPanel>
      </Tabs>
    </Box>
  );
}
