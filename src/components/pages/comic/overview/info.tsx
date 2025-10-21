import { useRouter } from "next/router";
import {
  Box,
  Divider,
  Button,
  Typography,
  Sheet,
  Stack,
  Grid,
  Chip,
} from "@mui/joy";
import EditIcon from "@mui/icons-material/Edit";
import { useImageFiles } from "@/hooks/useImageFiles";
import { ComicInfo } from "@/types/comic";
import PagePreviewPanel from "@/components/pages/PreviewPanel";
import { useArchiveContext } from "@/contexts/ArchiveContext";

export default function InfoTab() {
  const router = useRouter();
  const { imageFiles, loading, error } = useImageFiles();
  const archive = useArchiveContext();
  const comicInfo: ComicInfo = archive?.result?.comic_info || {};

  if (loading) {
    return <Typography data-testid="info-loading">Loading...</Typography>;
  }

  if (error) {
    return (
      <Typography data-testid="info-error" color="danger">
        Error: {error}
      </Typography>
    );
  }

  if (imageFiles.length === 0) {
    return (
      <Typography data-testid="info-no-images">No images found.</Typography>
    );
  }

  const coverFile = imageFiles[0];

  return (
    <Stack
      id="InfoTab-Root"
      direction="row"
      spacing={0}
      sx={{
        // height: "calc(100vh - 90px)",
        height: "100%",
        width: "100%",

        // display: "flex",
        // p: 2,
      }}
    >
      <Sheet
        id="InfoTab-MainSheet"
        variant="plain"
        sx={{
          height: "100%",
          width: "100%",
          // flex: 1,
          display: "flex",
          // p: 2,
        }}
      >
        <Grid
          container
          sx={{ height: "100%", width: "100%", p: 2 }}
          spacing={2}
        >
          <Grid xs={4} id="InfoTab-CoverViewGrid">
            <Stack
              spacing={2}
              sx={{
                height: "100%",
                width: "100%",
              }}
            >
              <Typography
                data-testid="comic-title"
                sx={{
                  justifyContent: "center",
                  textAlign: "center",
                }}
                level="title-lg"
              >
                {comicInfo.Title || "Unknown Title"}
              </Typography>

              <Box
                id="InfoTab-CoverPreview"
                sx={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 0,
                }}
              >
                <PagePreviewPanel
                  targetFile={coverFile}
                  targetPageNumber={"1"}
                />
              </Box>

              <Button
                data-testid="info-edit-button"
                startDecorator={<EditIcon />}
                disabled={!archive?.path}
                sx={{ mt: 0, flexShrink: 0, alignSelf: "center" }}
                onClick={() =>
                  archive?.path &&
                  router.push(
                    `/comic/edit/edit-page-info-v2?path=${encodeURIComponent(archive.path)}`,
                  )
                }
              >
                Edit
              </Button>
            </Stack>
          </Grid>

          <Grid id="InfoTab-DetailsGrid" xs={8}>
            <Box
              id="InfoTab-Details"
              sx={{
                height: "100%",
                width: "100%",
                flex: 1,
                // minHeight: 0,
                // overflow: "hidden",
                justifyContent: "center",
              }}
            >
              <Sheet
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "md",
                  justifyContent: "center",
                  height: "100%",
                  overflow: "auto",
                }}
              >
                <Stack spacing={2}>
                  {comicInfo.Title && (
                    <>
                      <Typography level="h2" sx={{ textAlign: "center" }}>
                        {comicInfo.Title}
                      </Typography>
                      <Divider />
                    </>
                  )}
                  {comicInfo.Series && (
                    <Typography data-testid="comic-series" level="title-lg">
                      {comicInfo.Series}
                    </Typography>
                  )}
                  {comicInfo.Number && (
                    <Typography data-testid="comic-number" level="body-md">
                      Number: {comicInfo.Number}
                    </Typography>
                  )}
                  {comicInfo.Count && (
                    <Typography data-testid="comic-count" level="body-sm">
                      Count: {comicInfo.Count}
                    </Typography>
                  )}
                  {comicInfo.Volume && (
                    <Typography data-testid="comic-volume" level="body-sm">
                      Volume: {comicInfo.Volume}
                    </Typography>
                  )}
                  {comicInfo.AlternateSeries && (
                    <Typography
                      data-testid="comic-alternate-series"
                      level="body-sm"
                    >
                      Alternate Series: {comicInfo.AlternateSeries}
                    </Typography>
                  )}
                  {comicInfo.AlternateNumber && (
                    <Typography
                      data-testid="comic-alternate-number"
                      level="body-sm"
                    >
                      Alternate Number: {comicInfo.AlternateNumber}
                    </Typography>
                  )}
                  {comicInfo.AlternateCount && (
                    <Typography
                      data-testid="comic-alternate-count"
                      level="body-sm"
                    >
                      Alternate Count: {comicInfo.AlternateCount}
                    </Typography>
                  )}
                  {comicInfo.Summary && (
                    <Typography data-testid="comic-summary" level="body-sm">
                      Summary: {comicInfo.Summary}
                    </Typography>
                  )}
                  {comicInfo.Notes && (
                    <Typography data-testid="comic-notes" level="body-sm">
                      Notes: {comicInfo.Notes}
                    </Typography>
                  )}
                  {(comicInfo.Year || comicInfo.Month || comicInfo.Day) && (
                    <Typography data-testid="comic-date" level="body-sm">
                      Date:{" "}
                      {[comicInfo.Year, comicInfo.Month, comicInfo.Day]
                        .filter(Boolean)
                        .join("-")}
                    </Typography>
                  )}
                  {comicInfo.Writer && (
                    <Typography data-testid="comic-writer" level="body-sm">
                      Writer: {comicInfo.Writer}
                    </Typography>
                  )}
                  {comicInfo.Penciller && (
                    <Typography data-testid="comic-penciller" level="body-sm">
                      Penciller: {comicInfo.Penciller}
                    </Typography>
                  )}
                  {comicInfo.Inker && (
                    <Typography data-testid="comic-inker" level="body-sm">
                      Inker: {comicInfo.Inker}
                    </Typography>
                  )}
                  {comicInfo.Colorist && (
                    <Typography data-testid="comic-colorist" level="body-sm">
                      Colorist: {comicInfo.Colorist}
                    </Typography>
                  )}
                  {comicInfo.Letterer && (
                    <Typography data-testid="comic-letterer" level="body-sm">
                      Letterer: {comicInfo.Letterer}
                    </Typography>
                  )}
                  {comicInfo.CoverArtist && (
                    <Typography
                      data-testid="comic-cover-artist"
                      level="body-sm"
                    >
                      Cover Artist: {comicInfo.CoverArtist}
                    </Typography>
                  )}
                  {comicInfo.Editor && (
                    <Typography data-testid="comic-editor" level="body-sm">
                      Editor: {comicInfo.Editor}
                    </Typography>
                  )}
                  {comicInfo.Translator && (
                    <Typography data-testid="comic-translator" level="body-sm">
                      Translator: {comicInfo.Translator}
                    </Typography>
                  )}
                  {comicInfo.Publisher && (
                    <Typography data-testid="comic-publisher" level="body-sm">
                      Publisher: {comicInfo.Publisher}
                    </Typography>
                  )}
                  {comicInfo.Imprint && (
                    <Typography data-testid="comic-imprint" level="body-sm">
                      Imprint: {comicInfo.Imprint}
                    </Typography>
                  )}
                  {comicInfo.Genre && (
                    <Typography data-testid="comic-genre" level="body-sm">
                      Genre: {comicInfo.Genre}
                    </Typography>
                  )}

                  {comicInfo.Web && (
                    <Typography data-testid="comic-web" level="body-sm">
                      Web: {comicInfo.Web}
                    </Typography>
                  )}
                  {comicInfo.PageCount && (
                    <Typography data-testid="comic-page-count" level="body-sm">
                      Page Count: {comicInfo.PageCount}
                    </Typography>
                  )}
                  {comicInfo.Tags && (
                    <Box
                      data-testid="comic-tags"
                      sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                    >
                      {comicInfo.Tags.split(",").map((tag, i) => (
                        <Chip
                          variant="solid"
                          color="primary"
                          key={i}
                          data-testid={`comic-tag-${i}`}
                          sx={{ mx: 0 }}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </Box>
                  )}
                </Stack>
              </Sheet>
            </Box>
          </Grid>
        </Grid>
      </Sheet>
    </Stack>
  );
}
