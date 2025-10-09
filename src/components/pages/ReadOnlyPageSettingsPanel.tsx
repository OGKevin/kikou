import { Box, Typography, Stack, Button, Card, CardContent } from "@mui/joy";
import EditIcon from "@mui/icons-material/Edit";
import { ComicPageInfo } from "@/types/comic";
import { useArchiveContext } from "@/contexts/ArchiveContext";
import { useRouter } from "next/router";

interface ReadOnlyPageSettingsPanelProps {
  pageInfo: ComicPageInfo;
}

export default function ReadOnlyPageSettingsPanel({
  pageInfo,
}: ReadOnlyPageSettingsPanelProps) {
  const archive = useArchiveContext();
  const router = useRouter();
  const archivePath = archive?.path;

  const handleEdit = () => {
    if (archivePath) {
      router.push(
        `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(archivePath)}`,
      );
    }
  };

  return (
    <Card
      variant="outlined"
      color={pageInfo.IsEmpty() ? "neutral" : "primary"}
      sx={{ width: 300, maxHeight: "100%", overflowY: "auto", p: 0 }}
    >
      <CardContent>
        <Box sx={{ px: 2.5, pb: 2.5, pt: 2.5 }}>
          <Stack spacing={2}>
            <Box>
              <Typography level="body-md">Type</Typography>
              <Typography level="body-lg">{pageInfo.Type}</Typography>
            </Box>
            <Box>
              <Typography level="body-md">Double Page</Typography>
              <Typography level="body-lg">
                {pageInfo.DoublePage ? "Yes" : "No"}
              </Typography>
            </Box>
            <Box>
              <Typography level="body-md">Bookmark</Typography>
              <Typography level="body-lg">
                {pageInfo.Bookmark || "-"}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="soft"
            color={pageInfo.IsEmpty() ? "primary" : "neutral"}
            startDecorator={<EditIcon />}
            sx={{ mt: 3, width: "100%" }}
            onClick={handleEdit}
            disabled={!archivePath}
          >
            Edit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
