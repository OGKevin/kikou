import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Typography,
  Divider,
  Stack,
} from "@mui/joy";
import { useTheme } from "@/contexts/ThemeContext";
import LightModeIcon from "@mui/icons-material/LightMode";
import ComputerIcon from "@mui/icons-material/Computer";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { setTheme } from "@tauri-apps/api/app";
import ComicsDrawer from "@/components/drawers/ComicsDrawer";
import { RecentComicFilesProvider } from "@/contexts/RecentComicFilesContext";
import ComicEditTabs from "@/components/navigation/ComicEditTabs";
import { useNavigationContext } from "@/contexts/NavigationContext";

export default function Navigation() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { mode, setMode, mounted } = useTheme();
  const {
    openClearDialog,
    tabs,
    buttons,
    currentTab,
    setCurrentTab,
    onTabChange,
  } = useNavigationContext();

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [cornerWidth, setCornerWidth] = useState<number | undefined>(undefined);

  const navigationItems = [{ label: "Home", path: "/", show: true }];

  const themeModes = ["light", "dark", "system"];

  const handleThemeToggle = async () => {
    if (!mode) return;

    const currentIndex = themeModes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themeModes.length;
    const nextMode = themeModes[nextIndex];

    if (nextMode === "system") {
      await setTheme(null);
      setMode("system");
      return;
    }

    if (nextMode === "light" || nextMode === "dark") {
      await setTheme(nextMode);
      setMode(nextMode);
    }
  };

  const getThemeIcon = () => {
    if (!mounted) return;

    if (mode === "light") return <LightModeIcon fontSize="small" />;

    if (mode === "dark") return <DarkModeIcon fontSize="small" />;

    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <ComputerIcon fontSize="small" />
      </Box>
    );
  };
  const getThemeLabel = () => {
    if (!mounted || !mode) return;

    if (mode === "system") return "System";

    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  useEffect(() => {
    const left = leftRef.current?.offsetWidth ?? 0;
    const right = rightRef.current?.offsetWidth ?? 0;
    const max = Math.max(left, right);

    if (max > 0) setCornerWidth(max);
  }, [buttons, mounted]);

  return (
    <RecentComicFilesProvider>
      <>
        <Stack
          direction="row"
          component="nav"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 1.5,
            backgroundColor: "background.surface",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            minHeight: "60px",
          }}
        >
          <Box
            ref={leftRef}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 0,
              flexShrink: 1,
              minWidth: 0,
              width: cornerWidth ? `${cornerWidth}px` : undefined,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                variant="outlined"
                color="neutral"
                size="sm"
                onClick={() => setDrawerOpen(true)}
              >
                ☰
              </IconButton>
              <Typography level="title-md" sx={{ fontWeight: "bold" }}>
                Kikou
              </Typography>
            </Box>

            {buttons.length > 0 && <Divider orientation="vertical" />}

            {buttons.map((btn, idx) => (
              <Button
                key={btn.label + idx}
                variant="outlined"
                color="neutral"
                size="sm"
                startDecorator={btn.icon}
                onClick={btn.onClick}
                disabled={btn.disabled}
                title={btn.tooltip}
              >
                {btn.label}
              </Button>
            ))}
          </Box>

          {tabs.length > 0 && (
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "center",
                minWidth: 0,
              }}
            >
              <ComicEditTabs
                currentTab={currentTab ?? undefined}
                onTabChange={
                  onTabChange ||
                  ((_, newValue) => setCurrentTab(newValue as string))
                }
                tabsDisabled={false}
                tabs={tabs}
              />
            </Box>
          )}

          <Box
            ref={rightRef}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              flexGrow: 0,
              flexShrink: 1,
              minWidth: 0,
              width: cornerWidth ? `${cornerWidth}px` : undefined,
            }}
          >
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              loading={!mounted}
              onClick={handleThemeToggle}
              startDecorator={getThemeIcon()}
            >
              {getThemeLabel()}
            </Button>
          </Box>
        </Stack>

        {/* Drawer */}
        <Drawer
          anchor="left"
          color="neutral"
          size="sm"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box
            sx={{
              p: 2,
              height: "100%",
              backgroundColor: "background.surface",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Top section: Home */}
            <Box>
              <Typography level="title-lg" sx={{ fontWeight: "bold" }}>
                Navigation
              </Typography>
              <Divider />
              <List size="sm">
                {navigationItems.map(
                  (item) =>
                    item.show && (
                      <ListItem key={item.path}>
                        <ListItemButton
                          onClick={() => {
                            setDrawerOpen(false);
                            router.push(item.path);
                          }}
                          selected={router.pathname === item.path}
                        >
                          <ListItemContent>
                            <Typography level="body-md">
                              {item.label}
                            </Typography>
                          </ListItemContent>
                        </ListItemButton>
                      </ListItem>
                    ),
                )}
              </List>
              <ComicsDrawer onCloseDrawer={() => setDrawerOpen(false)} />
            </Box>
            {/* Bottom section: ComicsDrawer and Clear button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                onClick={openClearDialog}
                color="danger"
                variant="soft"
                size="md"
                sx={{ mt: 2 }}
              >
                Clear Cache
              </Button>
            </Box>
          </Box>
        </Drawer>
      </>
    </RecentComicFilesProvider>
  );
}
