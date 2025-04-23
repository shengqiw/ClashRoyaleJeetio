import { Box } from "@mui/material";
import MonkBG from "@/assets/monk-bg.jpg";

export default function Test() {
  return (
    <Box minHeight={"100vh"}>
      <div
        style={{
          backgroundImage: `url(${MonkBG.src})`,
          height: "100vh",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          opacity: '0.7',
          width: "100%",
        }}
      ></div>
    </Box>
  );
}
