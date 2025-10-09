import React, { createContext, useContext, useState, ReactNode } from "react";

export interface NavigationTab {
  label: string;
  value: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface NavigationButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

interface NavigationContextType {
  showClearDialog: boolean;
  openClearDialog: () => void;
  closeClearDialog: () => void;
  tabs: NavigationTab[];
  setTabs: (tabs: NavigationTab[]) => void;
  buttons: NavigationButton[];
  setButtons: (buttons: NavigationButton[]) => void;
  currentTab: string | null;
  setCurrentTab: (tab: string | null) => void;
  onTabChange:
    | ((
        event: React.SyntheticEvent | null,
        newValue: string | number | null,
      ) => void)
    | null;
  setOnTabChange: (
    handler:
      | ((
          event: React.SyntheticEvent | null,
          newValue: string | number | null,
        ) => void)
      | null,
  ) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export function useNavigationContext() {
  const ctx = useContext(NavigationContext);

  if (!ctx)
    throw new Error(
      "useNavigationContext must be used within NavigationProvider",
    );

  return ctx;
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [tabs, setTabs] = useState<NavigationTab[]>([]);
  const [buttons, setButtons] = useState<NavigationButton[]>([]);
  const [currentTab, setCurrentTab] = useState<string | null>(null);
  const [onTabChange, setOnTabChange] = useState<
    | ((
        event: React.SyntheticEvent | null,
        newValue: string | number | null,
      ) => void)
    | null
  >(() => null);

  function openClearDialog() {
    setShowClearDialog(true);
  }

  function closeClearDialog() {
    setShowClearDialog(false);
  }

  return (
    <NavigationContext.Provider
      value={{
        showClearDialog,
        openClearDialog,
        closeClearDialog,
        tabs,
        setTabs,
        buttons,
        setButtons,
        currentTab,
        setCurrentTab,
        onTabChange,
        setOnTabChange,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}
