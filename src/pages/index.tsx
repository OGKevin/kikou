"use client";

import { useRouter } from "next/router";
import { Box, Button, Typography, Card } from "@mui/joy";

export default function Page() {
  const router = useRouter();

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: 3,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            maxWidth: 600,
            width: "100%",
            padding: 4,
            textAlign: "center",
          }}
        >
          <Typography level="h1" fontSize="2.5rem" fontWeight="bold">
            Kikou
          </Typography>
          <Button
            onClick={() => router.push("/comic/edit")}
            size="lg"
            variant="solid"
            color="primary"
            sx={{ mt: 3 }}
          >
            Go to Comic Editor
          </Button>
        </Card>
      </Box>
    </>
  );
}
