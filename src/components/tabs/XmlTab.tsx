import React from "react";
import { Box } from "@mui/joy";
import XmlEditor from "./XmlEditor";

export default function XmlTab() {
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <XmlEditor />
    </Box>
  );
}
