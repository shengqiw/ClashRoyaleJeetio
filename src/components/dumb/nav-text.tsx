import { Typography } from "@mui/material";
import Link from "next/link";

export const NavText = ({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) => {
  return (
    <Link href={href} className="no-underline">
      <Typography variant="h5" color="white" className="inline">
        {children}
      </Typography>
    </Link>
  );
};
