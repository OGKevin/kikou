import type { AppProps } from "next/app";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { useRouter } from "next/router";
import theme from "@/theme/theme";
import "@/styles/globals.css";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { devLog } from "@/utils/devLog";
import { getPageWrapper } from "@/components/PageWrapperFactory";

function AppContent({ Component, pageProps, router }) {
  const path = router.query.path as string;

  devLog("AppContent render", { path, pathname: router.pathname });

  const content = <Component {...pageProps} />;

  return getPageWrapper({ path, pathname: router.pathname, content });
}

export default function App(appProps: AppProps) {
  return (
    <CssVarsProvider theme={theme} defaultMode="system">
      <ThemeProvider>
        <CssBaseline />
        <AppContent {...appProps} router={useRouter()} />
      </ThemeProvider>
    </CssVarsProvider>
  );
}
