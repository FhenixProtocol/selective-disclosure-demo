import { Toaster } from "@client/ui/components/sonner";
import { HeadContent, Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Access Delegation Demo",
      },
      {
        name: "description",
        content: "FHE access delegation demo with CoFHE SDK",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <AppShell />
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}

function AppShell() {
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "dark" ? "/fhenix_logo_dark.svg" : "/logo_light.svg";

  return (
    <div className="min-h-svh px-4 py-6 sm:px-6 lg:px-8">
      {/* Header: logo + title + nav + theme toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <img src={logoSrc} alt="Fhenix" className="h-8" />
          <div className="hidden sm:block h-8 w-px bg-border/40" />
          <div>
            <h1 className="text-2xl font-semibold uppercase text-foreground lg:text-3xl">
              Access Delegation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Privacy-preserving compliance with FHE
            </p>
          </div>
          <nav className="hidden sm:flex items-center gap-1 ml-4">
            <Link
              to="/holder"
              className="text-sm font-semibold uppercase px-3 py-1.5 rounded-lg transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{
                className: "text-foreground bg-accent/15",
              }}
              inactiveProps={{
                className: "text-foreground/50 hover:text-foreground/75 hover:bg-foreground/5",
              }}
            >
              Token Holder
            </Link>
            <Link
              to="/verifier"
              className="text-sm font-semibold uppercase px-3 py-1.5 rounded-lg transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeProps={{
                className: "text-foreground bg-accent/15",
              }}
              inactiveProps={{
                className: "text-foreground/50 hover:text-foreground/75 hover:bg-foreground/5",
              }}
            >
              Compliance Verifier
            </Link>
          </nav>
        </div>
        <ModeToggle />
      </div>

      {/* Mobile nav */}
      <nav className="flex sm:hidden items-center gap-1 mb-4">
        <Link
          to="/holder"
          className="flex-1 text-center text-sm font-semibold uppercase px-3 py-1.5 rounded-lg transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          activeProps={{
            className: "text-foreground bg-accent/15",
          }}
          inactiveProps={{
            className: "text-foreground/50 hover:text-foreground/75 hover:bg-foreground/5",
          }}
        >
          Token Holder
        </Link>
        <Link
          to="/verifier"
          className="flex-1 text-center text-sm font-semibold uppercase px-3 py-1.5 rounded-lg transition-[color,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          activeProps={{
            className: "text-foreground bg-accent/15",
          }}
          inactiveProps={{
            className: "text-foreground/50 hover:text-foreground/75 hover:bg-foreground/5",
          }}
        >
          Compliance Verifier
        </Link>
      </nav>

      <div className="border-b border-border/30 mb-6" />

      <Outlet />
    </div>
  );
}
