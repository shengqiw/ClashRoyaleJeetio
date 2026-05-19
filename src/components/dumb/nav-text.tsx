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
          color: "rgba(255,255,255,0.80)",
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          transition: "color 0.15s",
          "&:hover": { color: "#fff" },
        }}
      >
        {children}
      </Typography>
    </Link>
  );
};
