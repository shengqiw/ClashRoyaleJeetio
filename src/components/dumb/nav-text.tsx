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
      <Typography
        className="inline"
        sx={{
          color: "rgba(226,224,255,0.82)",
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          transition: "color 0.15s, text-shadow 0.15s",
          "&:hover": {
            color: "#cdbcff",
            textShadow: "0 0 12px rgba(150,130,255,0.6)",
          },
        }}
      >
        {children}
      </Typography>
    </Link>
  );
};
