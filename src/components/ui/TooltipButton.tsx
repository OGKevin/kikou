import React from "react";
import { Button, Tooltip, ButtonProps } from "@mui/joy";

type TooltipButtonProps = ButtonProps & {
  tooltip?: string | null;
};

export default function TooltipButton({
  tooltip,
  disabled,
  children,
  ...buttonProps
}: TooltipButtonProps) {
  // If button is disabled and a tooltip was provided, wrap button with tooltip
  if (disabled && tooltip) {
    return (
      <Tooltip variant="solid" arrow placement="top" title={tooltip}>
        <span>
          <Button disabled {...(buttonProps as ButtonProps)}>
            {children}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button disabled={disabled} {...(buttonProps as ButtonProps)}>
      {children}
    </Button>
  );
}
