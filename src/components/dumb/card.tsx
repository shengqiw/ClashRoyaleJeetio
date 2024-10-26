"use client";
import { Card, CardActionArea, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
export const MyCard = ({
  bgImage,
  title,
  href,
}: {
  bgImage: string;
  title: string;
  href: string;
}) => {
  const router = useRouter();
  console.log('env', bgImage);
  return (
    <Card
      style={{ backgroundImage: `url(${bgImage})` }}
      className="my-card"
      onClick={() => router.push(href)}
    >
      <div className="center-x trans-bg">
        <Typography variant="h4" color="white" p={1}>
          {title}
        </Typography>
      </div>
    </Card>
  );
};
