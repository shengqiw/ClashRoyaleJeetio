'use client';
import { Card, CardActionArea, Typography } from "@mui/material";
export const MyCard = ({
  bgImage,
  title,
}: {
  bgImage: string;
  title: string;
}) => {
  return (
    <Card style={{ backgroundImage: `url(${bgImage})` }} className="my-card" onClick={() => console.log('click')}>
        <div className="center-x trans-bg">
          <Typography variant="h4" color="white" p={1}>
            {title}
          </Typography>
        </div>
    </Card>
  );
};
