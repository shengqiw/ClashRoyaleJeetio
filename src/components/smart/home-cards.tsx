import { Grid2 as Grid } from "@mui/material";
import { MyCard } from "../dumb/card";
import { cardFeatures } from "@/lib/features";

/** Home tiles come from the feature registry — see src/lib/features.ts to add one. */
export const HomeCards = () => {
  const features = cardFeatures();
  return (
    <Grid container spacing={8} paddingX={8}>
      {features.map((f) => (
        <Grid key={f.key} size={{ xs: 12, md: 12 / Math.min(features.length, 3) }}>
          <MyCard
            bgImage={f.card!.image.src}
            title={f.title}
            href={f.href}
            styleProps={f.card!.styleProps}
          />
        </Grid>
      ))}
    </Grid>
  );
};
