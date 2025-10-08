import {
  Button,
  Card,
  CardContent,
  Chip,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Box,
} from "@mui/joy";
import { useRecentComicFiles } from "@/contexts/RecentComicFilesContext";

interface RecentFilesProps {
  onFileSelect: (path: string) => void;
}

export default function RecentComicFiles({ onFileSelect }: RecentFilesProps) {
  const { recentFiles, clearRecentFiles } = useRecentComicFiles();

  const handleClearRecent = () => {
    clearRecentFiles();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (recentFiles.length === 0) {
    return null;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        mt: 3,
        maxWidth: 600,
        width: "100%",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography level="h4" component="h3">
            Recent Files
          </Typography>
          <Button
            onClick={handleClearRecent}
            variant="soft"
            color="danger"
            size="sm"
          >
            Clear
          </Button>
        </Box>

        <List size="sm">
          {recentFiles.map((file, index) => (
            <ListItem key={index}>
              <ListItemButton
                onClick={() => onFileSelect(file.path)}
                sx={{
                  borderRadius: "sm",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
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
                  <Typography level="title-sm" fontWeight="bold">
                    {file.name}
                  </Typography>
                  <Chip size="sm" variant="soft" color="neutral">
                    {formatDate(file.lastOpened)}
                  </Chip>
                </Box>
                <Typography
                  level="body-xs"
                  color="neutral"
                  sx={{
                    wordBreak: "break-all",
                    maxWidth: "100%",
                  }}
                >
                  {file.path}
                </Typography>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
