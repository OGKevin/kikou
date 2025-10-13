import { useEffect } from "react";
import { useNavigationContext } from "@/contexts/NavigationContext";

export function useResetNavigation() {
  const navigationContext = useNavigationContext();

  useEffect(() => {
    navigationContext.setTabs([]);
    navigationContext.setButtons([]);
  }, []);
}
