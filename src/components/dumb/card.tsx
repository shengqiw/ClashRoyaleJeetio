"use client";
import { Card, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
export const MyCard = ({
  bgImage,
  title,
  href,
  styleProps = {}
}: {
  bgImage: string;
  title: string;
  href: string;
  styleProps?: object
}) => {
  const router = useRouter();
  return (
    <Card
      style={{ backgroundImage: `url(${bgImage})`, ...styleProps }}
      className="my-card"
      onClick={() => router.push(href)}
    >
      <div className="center-x trans-bg">
        <Typography variant="h4" sx={{ color: "white", p: 1 }}>
          {title}
        </Typography>
      </div>
    </Card>
  );
};
