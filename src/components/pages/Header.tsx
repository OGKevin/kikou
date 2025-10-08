import React from "react";
import { Box, Typography, Button, Stack } from "@mui/joy";
import ConfirmationButton from "../ui/ConfirmationButton";

interface ButtonConfig {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  color?: "primary" | "neutral" | "danger" | "success" | "warning";
  variant?: "solid" | "soft" | "outlined" | "plain";
}

interface ConfirmationButtonConfig {
  onConfirm: () => void | Promise<void>;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tooltip?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
}

interface ComicHeaderProps {
  title: string;
  buttons: ButtonConfig[];
  confirmationButton?: ConfirmationButtonConfig;
  titleLevel?: "h1" | "h2";
}

export default function ComicHeader({
  title,
  buttons,
  confirmationButton,
  titleLevel = "h1",
}: ComicHeaderProps) {
  return (
    <Box
      sx={{
        padding: 1.5,
        borderBottom: 1,
        borderColor: "divider",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "background.surface",
        minHeight: "56px",
      }}
    >
      <Typography level={titleLevel} fontSize="1.5rem">
        {title}
      </Typography>
      <Stack direction="row" spacing={1}>
        {buttons.map((button, index) => (
          <Button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled}
            color={button.color || "success"}
            variant={button.variant || "solid"}
            size="sm"
          >
            {button.label}
          </Button>
        ))}
        {confirmationButton && (
          <ConfirmationButton
            onConfirm={confirmationButton.onConfirm}
            confirmTitle={confirmationButton.confirmTitle}
            confirmMessage={confirmationButton.confirmMessage}
            confirmLabel={confirmationButton.confirmLabel}
            cancelLabel={confirmationButton.cancelLabel}
            tooltip={confirmationButton.tooltip}
            disabled={confirmationButton.disabled}
          >
            {confirmationButton.children}
          </ConfirmationButton>
        )}
      </Stack>
    </Box>
  );
}
