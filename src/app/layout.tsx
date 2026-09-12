import type { Metadata, Viewport } from "next";
// Geist from the npm package, not next/font/google: same self-hosted woff2 output,
// same --font-geist-* variables, but the build no longer needs to reach
// fonts.googleapis.com (which made `next build` fail anywhere Google is blocked).
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";
import { MuiAppProvider } from "@/components/providers/mui-app-provider";
import { PageLayout } from "@/components/smart/page-layout";
import { PwaRegister } from "@/components/dumb/pwa-register";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const geistSans = GeistSans;
const geistMono = GeistMono;

// Site-wide metadata. Each route folder has its own layout.tsx that overrides
// title/description (pages are client components, so they can't export metadata).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  // PWA: manifest.ts is auto-linked; this block is the iOS side of it
  // (Safari ignores the manifest's display mode and reads these instead).
  appleWebApp: {
    capable: true,
    title: "Jeetio",
    statusBarStyle: "black-translucent",
  },
  applicationName: "Jeetio",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#c293f8",
  // Lets content extend under the iPhone notch / home indicator when installed;
  // .pwa-bar uses env(safe-area-inset-bottom) to stay clear of it.
  viewportFit: "cover",
};

// schema.org Organization block — tells search engines / AI assistants who this
// site is instead of leaving them to guess from 80 words of homepage copy.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Jeetio",
  url: SITE_URL,
  logo: `${SITE_URL}/og.png`,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="no-margin">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* Google Analytics — cookieless. Consent Mode defaults every storage
            type to "denied", so gtag never sets _ga cookies; GA4 still receives
            cookieless pings (page views / events) and models the rest.
            Trade: no returning-user or session stitching. Gain: no cookie
            banner, and nothing is set before consent. */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-71GQ1DXYJH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied'
            });
            gtag('js', new Date());
            gtag('config', 'G-71GQ1DXYJH', { anonymize_ip: true });
          `}
        </Script>
        <MuiAppProvider>
          <PageLayout>{children}</PageLayout>
          <PwaRegister />
        </MuiAppProvider>
      </body>
    </html>
  );
}
