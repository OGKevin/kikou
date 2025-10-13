import React from "react";
import {
  Box,
  Input,
  Switch,
  Typography,
  FormControl,
  FormLabel,
  Stack,
} from "@mui/joy";

interface PageSelectorProps {
  targetPageNumber: string;
  onPageNumberChange: (value: string) => void;
  useFileName: boolean;
  onUseFileNameChange: (checked: boolean) => void;
  imageFiles: string[];
  targetFile: string | null;
}

export default function PageSelector({
  targetPageNumber,
  onPageNumberChange,
  useFileName,
  onUseFileNameChange,
  imageFiles,
  targetFile,
}: PageSelectorProps) {
  const handlePageNumberChange = (val: string) => {
    onPageNumberChange(val);
  };

  const handleUseFileNameChange = (checked: boolean) => {
    onUseFileNameChange(checked);
  };

  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <FormControl>
          <FormLabel sx={{ fontSize: "lg", fontWeight: "bold" }}>
            Page Number:
          </FormLabel>
          <Input
            type="number"
            slotProps={{
              input: {
                min: 0,
                max: imageFiles.length,
                inputMode: "numeric",
                pattern: "[0-9]*",
              },
            }}
            value={targetPageNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");

              handlePageNumberChange(val);
            }}
            sx={{ width: 100 }}
          />
        </FormControl>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            checked={useFileName}
            onChange={(e) => handleUseFileNameChange(e.target.checked)}
            size="sm"
          />
          <Typography level="body-sm">
            Use file name (e.g. page_010.jpeg)
          </Typography>
        </Box>
      </Stack>

      <Typography level="body-sm" color="neutral">
        {`Total pages: ${imageFiles.length}${targetFile ? ` | Selected: ${targetFile}` : ""}`}
      </Typography>
    </Box>
  );
}
