import React from "react";
import { Tabs, TabList, Tab, tabClasses, Tooltip } from "@mui/joy";

interface ComicEditTabsProps {
  currentTab?: string;
  onTabChange?: (
    event: React.SyntheticEvent | null,
    newValue: string | number | null,
  ) => void;
  tabsDisabled?: boolean;
  tabs: Array<{
    label: string;
    value: string;
    disabled?: boolean;
    tooltip?: string;
  }>;
}

const ComicEditTabs: React.FC<ComicEditTabsProps> = ({
  currentTab,
  onTabChange,
  tabs,
}) => {
  if (!currentTab || !onTabChange || !tabs || tabs.length === 0) return null;

  return (
    <Tabs
      value={currentTab}
      onChange={onTabChange}
      sx={{ bgcolor: "transparent" }}
    >
      <TabList
        disableUnderline
        sx={{
          p: 0.5,
          gap: 0.5,
          borderRadius: "xl",
          bgcolor: "background.level1",
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: "sm",
            bgcolor: "background.surface",
          },
        }}
      >
        {tabs.map((tab) =>
          tab.tooltip ? (
            <Tooltip
              key={tab.value}
              variant="outlined"
              color={tab.disabled ? "danger" : "warning"}
              arrow
              title={tab.tooltip}
              placement="bottom"
            >
              <span>
                <Tab disableIndicator value={tab.value} disabled={tab.disabled}>
                  {tab.label}
                </Tab>
              </span>
            </Tooltip>
          ) : (
            <Tab
              key={tab.value}
              disableIndicator
              value={tab.value}
              disabled={tab.disabled}
            >
              {tab.label}
            </Tab>
          ),
        )}
      </TabList>
    </Tabs>
  );
};

export default ComicEditTabs;
