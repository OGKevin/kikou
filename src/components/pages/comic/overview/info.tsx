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
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="danger">Error: {error}</Typography>;
  }

  if (imageFiles.length === 0) {
    return <Typography>No images found.</Typography>;
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
                    <Typography level="title-lg">{comicInfo.Series}</Typography>
                  )}
                  {comicInfo.Number && (
                    <Typography level="body-md">
                      Issue #{comicInfo.Number}
                    </Typography>
                  )}
                  {comicInfo.Count && (
                    <Typography level="body-sm">
                      Count: {comicInfo.Count}
                    </Typography>
                  )}
                  {comicInfo.Volume && (
                    <Typography level="body-sm">
                      Volume: {comicInfo.Volume}
                    </Typography>
                  )}
                  {comicInfo.AlternateSeries && (
                    <Typography level="body-sm">
                      Alternate Series: {comicInfo.AlternateSeries}
                    </Typography>
                  )}
                  {comicInfo.AlternateNumber && (
                    <Typography level="body-sm">
                      Alternate Number: {comicInfo.AlternateNumber}
                    </Typography>
                  )}
                  {comicInfo.AlternateCount && (
                    <Typography level="body-sm">
                      Alternate Count: {comicInfo.AlternateCount}
                    </Typography>
                  )}
                  {comicInfo.Summary && (
                    <Typography level="body-sm">
                      Summary: {comicInfo.Summary}
                    </Typography>
                  )}
                  {comicInfo.Notes && (
                    <Typography level="body-sm">
                      Notes: {comicInfo.Notes}
                    </Typography>
                  )}
                  {(comicInfo.Year || comicInfo.Month || comicInfo.Day) && (
                    <Typography level="body-sm">
                      Date:{" "}
                      {[comicInfo.Year, comicInfo.Month, comicInfo.Day]
                        .filter(Boolean)
                        .join("-")}
                    </Typography>
                  )}
                  {comicInfo.Writer && (
                    <Typography level="body-sm">
                      Writer: {comicInfo.Writer}
                    </Typography>
                  )}
                  {comicInfo.Penciller && (
                    <Typography level="body-sm">
                      Penciller: {comicInfo.Penciller}
                    </Typography>
                  )}
                  {comicInfo.Inker && (
                    <Typography level="body-sm">
                      Inker: {comicInfo.Inker}
                    </Typography>
                  )}
                  {comicInfo.Colorist && (
                    <Typography level="body-sm">
                      Colorist: {comicInfo.Colorist}
                    </Typography>
                  )}
                  {comicInfo.Letterer && (
                    <Typography level="body-sm">
                      Letterer: {comicInfo.Letterer}
                    </Typography>
                  )}
                  {comicInfo.CoverArtist && (
                    <Typography level="body-sm">
                      Cover Artist: {comicInfo.CoverArtist}
                    </Typography>
                  )}
                  {comicInfo.Editor && (
                    <Typography level="body-sm">
                      Editor: {comicInfo.Editor}
                    </Typography>
                  )}
                  {comicInfo.Translator && (
                    <Typography level="body-sm">
                      Translator: {comicInfo.Translator}
                    </Typography>
                  )}
                  {comicInfo.Publisher && (
                    <Typography level="body-sm">
                      Publisher: {comicInfo.Publisher}
                    </Typography>
                  )}
                  {comicInfo.Imprint && (
                    <Typography level="body-sm">
                      Imprint: {comicInfo.Imprint}
                    </Typography>
                  )}
                  {comicInfo.Genre && (
                    <Typography level="body-sm">
                      Genre: {comicInfo.Genre}
                    </Typography>
                  )}

                  {comicInfo.Web && (
                    <Typography level="body-sm">
                      Web: {comicInfo.Web}
                    </Typography>
                  )}
                  {comicInfo.PageCount && (
                    <Typography level="body-sm">
                      Page Count: {comicInfo.PageCount}
                    </Typography>
                  )}
                  {comicInfo.Tags && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {comicInfo.Tags.split(",").map((tag, i) => (
                        <Chip
                          variant="solid"
                          color="primary"
                          key={i}
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
