import React from "react";
import { useRecentComicFiles } from "@/contexts/RecentComicFilesContext";
import { Typography, List, ListItem, ListItemButton, Box } from "@mui/joy";
import IconButton from "@mui/joy/IconButton";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import Button from "@mui/joy/Button";
import ListSubheader from "@mui/joy/ListSubheader";

interface ComicsDrawerProps {
  onCloseDrawer?: () => void;
}

export default function ComicsDrawer({ onCloseDrawer }: ComicsDrawerProps) {
  const { recentFiles, pickAndSelectFile, goToEditPage } =
    useRecentComicFiles();
  const [openRecent, setOpenRecent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handlePickFile = async () => {
    setLoading(true);

    try {
      const selected = await pickAndSelectFile();

      if (selected) {
        goToEditPage(selected);
        onCloseDrawer?.();
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Box sx={{ mt: 2 }}>
      <List
        variant="outlined"
        size="sm"
        sx={{ width: "100%", borderRadius: "sm", mb: 2 }}
      >
        <ListItem nested>
          <ListSubheader
            sx={{
              fontSize: "0.85rem",
              py: 0.5,
              px: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Comics
          </ListSubheader>
        </ListItem>
      </List>
      <Button
        onClick={handlePickFile}
        size="sm"
        variant="plain"
        color="primary"
        loading={loading}
        sx={{ mb: 0, width: "100%" }}
      >
        Pick File
      </Button>
      <List size="sm">
        <ListItem nested>
          <ListItem
            component="div"
            sx={{ cursor: "pointer" }}
            onClick={() => setOpenRecent((v) => !v)}
          >
            <Typography level="body-xs" sx={{ textTransform: "uppercase" }}>
              Recent Comic Files
            </Typography>
            <IconButton
              variant="plain"
              size="sm"
              color="neutral"
              sx={{ ml: 1 }}
            >
              <KeyboardArrowDown
                sx={[
                  openRecent
                    ? { transform: "initial" }
                    : { transform: "rotate(-90deg)" },
                ]}
              />
            </IconButton>
          </ListItem>
          {openRecent && recentFiles.length > 0 && (
            <List sx={{ "--List-gap": "0px", "--ListItem-paddingY": "4px" }}>
              {recentFiles.map((file, index) => (
                <ListItem key={index}>
                  <ListItemButton
                    onClick={() => {
                      goToEditPage(file.path);
                      onCloseDrawer?.();
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Typography level="body-sm" fontWeight="bold">
                        {file.name}
                      </Typography>
                      <Typography
                        level="body-xs"
                        color="neutral"
                        sx={{ ml: 1 }}
                      >
                        {formatDate(file.lastOpened)}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </ListItem>
      </List>
    </Box>
  );
}
