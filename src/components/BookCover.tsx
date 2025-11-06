import { Box, Skeleton, Typography } from "@mui/joy";
import { useBookCover } from "@/hooks/useBookCover";

export interface BookCoverProps {
  bookId: number | null;
  width?: number | string;
  height?: number | string;
  alt?: string;
}

export function BookCover({
  bookId,
  width = 60,
  height = 90,
  alt = "Book cover",
}: BookCoverProps): React.ReactElement {
  const { coverUrl, loading, error } = useBookCover(bookId);

  if (bookId === null || error || (!loading && !coverUrl)) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width,
          height,
          bgcolor: "background.level1",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography level="body-xs" color="neutral">
          No cover
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        data-testid="book-cover-skeleton"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Skeleton
          animation="wave"
          variant="rectangular"
          width={width}
          height={height}
          sx={{
            borderRadius: 1,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="img"
        src={coverUrl || ""}
        alt={alt}
        sx={{
          width,
          height,
          objectFit: "cover",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      />
    </Box>
  );
}
