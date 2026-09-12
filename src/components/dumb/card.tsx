"use client";
import { Card, Typography } from "@mui/material";
import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";

/**
 * Homepage hero card. The art is rendered with next/image (fill) instead of a
 * CSS background-image: a background-image bypasses the image optimizer, so
 * phones were downloading the original 0.5–1.3 MB JPEGs — that was the 14 s
 * mobile LCP in the Sept 2026 audit. next/image serves a resized AVIF/WebP
 * sized to the slot instead.
 */
export const MyCard = ({
  image,
  title,
  href,
  priority = false,
  styleProps = {},
}: {
  image: StaticImageData;
  title: string;
  href: string;
  /** true for above-the-fold cards — they're the mobile LCP candidates. */
  priority?: boolean;
  styleProps?: object;
}) => {
  const router = useRouter();
  return (
    <Card
      style={styleProps}
      className="my-card"
      elevation={0}
      onClick={() => router.push(href)}
    >
      <Image
        src={image}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 900px) 100vw, 33vw"
        style={{ objectFit: "cover", zIndex: 0 }}
      />
      <div className="center-x trans-bg" style={{ position: "relative", zIndex: 1 }}>
        <Typography variant="h4" component="h2" sx={{ color: "white", p: 1 }}>
          {title}
        </Typography>
      </div>
    </Card>
  );
};
