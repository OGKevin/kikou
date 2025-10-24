import { Box, Skeleton } from "@mui/joy";

export interface BookCoverSkeletonProps {
  width?: number | string;
  height?: number | string;
}

export function BookCoverSkeleton({
  width = 60,
  height = 90,
}: BookCoverSkeletonProps) {
  return (
    <Box
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
