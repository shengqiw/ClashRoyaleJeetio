import type { Metadata } from "next";
import "./globals.css";
import { PageLayout } from "@/components/page-layout";

export const metadata: Metadata = {
  title: "Jeetio Clash Royale",
  description: "Jeetio clan website for Clash Royale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("RootLayout", process.env.APP_NAME);
  return (
    <html lang="en">
      <body>
        <PageLayout>{children}</PageLayout>
      </body>
    </html>
  );
}