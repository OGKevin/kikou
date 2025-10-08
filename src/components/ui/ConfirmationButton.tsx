import React, { useState } from "react";
import { Box, Button, Stack, Typography, ButtonProps } from "@mui/joy";
import TooltipButton from "./TooltipButton";

type ConfirmationButtonProps = ButtonProps & {
  onConfirm: () => Promise<void> | void;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tooltip?: string | null;
};

export default function ConfirmationButton({
  onConfirm,
  confirmTitle = "Confirm",
  confirmMessage = "Are you sure you want to proceed?",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  children,
  disabled,
  tooltip,
  ...buttonProps
}: ConfirmationButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (disabled) return;

    setOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <TooltipButton
        onClick={handleClick}
        color="danger"
        disabled={disabled}
        tooltip={tooltip}
        {...(buttonProps as ButtonProps)}
      >
        {children}
      </TooltipButton>

      {open && (
        <Box
          data-testid="confirmation-overlay"
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              bgcolor: "background.surface",
              p: 4,
              borderRadius: 2,
              boxShadow: 4,
              minWidth: 320,
              textAlign: "center",
            }}
          >
            <Typography level="h4" color="danger" sx={{ mb: 2 }}>
              {confirmTitle}
            </Typography>
            <Typography sx={{ mb: 3 }}>{confirmMessage}</Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                color="danger"
                variant="solid"
                size="lg"
                onClick={handleConfirm}
                loading={loading}
                sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
              >
                {confirmLabel}
              </Button>
              <Button
                color="neutral"
                variant="outlined"
                size="lg"
                onClick={() => setOpen(false)}
                sx={{ fontWeight: "bold", fontSize: 18, px: 4 }}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </>
  );
}
