import { Grid2 as Grid, Typography } from "@mui/material";
import "./stats.css";
import { ClanInfo } from "@/components/smart/clan-info";
import { MemberList } from "@/components/smart/member-list";

export default async function Stats() {
  const clanFetch = await fetch(
    "https://xgyzcbqe9i.execute-api.us-east-1.amazonaws.com/clan?tag=PRURJPJP"
  );

  const clanData = await clanFetch.json();
  const members = clanData.memberList;
  delete clanData.memberList
  console.log("clanData", clanData);

  return (
    <Grid container>
      <Grid offset={1} size={10} className="page-bg">
        <Typography variant="h1" className="gold-shadow center" mt={3}>
          Clan Stats
        </Typography>
        <div className="br" />
        <ClanInfo clan={clanData} />
        <MemberList members={members} />
      </Grid>
    </Grid>
  );
}
