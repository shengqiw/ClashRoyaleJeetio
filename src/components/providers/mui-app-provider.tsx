"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";

/**
 * Emotion + MUI cache for App Router streaming SSR (Next 16).
 * Keeps the root `layout` as a Server Component while isolating client-only MUI wiring.
 */
export function MuiAppProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      {children}
    </AppRouterCacheProvider>
  );
}
