import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "ReviewPilot — AI Review Management",
    template: "%s | ReviewPilot",
  },
  description:
    "Reply to Google reviews in seconds with AI. Manage your business reputation from anywhere — on desktop or your Android phone.",
  keywords: [
    "Google reviews", "review management", "AI replies", "review automation",
    "multi-language reviews", "business reputation",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ReviewPilot",
    startupImage: "/icons/icon-512x512.png",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "ReviewPilot — AI Review Management",
    description: "Reply to Google reviews in seconds with AI.",
    type: "website",
    siteName: "ReviewPilot",
  },
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png",   sizes: "72x72",   type: "image/png" },
      { url: "/icons/icon-96x96.png",   sizes: "96x96",   type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ReviewPilot" />
        <meta name="application-name" content="ReviewPilot" />
        <meta name="msapplication-TileColor" content="#7c3aed" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
