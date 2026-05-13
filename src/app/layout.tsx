import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MuiAppProvider } from "@/components/providers/mui-app-provider";
import { PageLayout } from "@/components/smart/page-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jeetio Clash Royale",
    template: "%s · Jeetio Clash Royale",
  },
  description: "Jeetio clan website for Clash Royale",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c293f8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="no-margin">
        <MuiAppProvider>
          <PageLayout>{children}</PageLayout>
        </MuiAppProvider>
      </body>
    </html>
  );
}
