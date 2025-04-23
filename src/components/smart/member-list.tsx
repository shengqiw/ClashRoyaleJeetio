// import {
//   Accordion,
//   AccordionDetails,
//   AccordionSummary,
//   Box,
//   Grid2 as Grid,
//   Typography,
// } from "@mui/material";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import TrophyIcon from "@/assets/trophy-icon.webp";
// import Image from "next/image";

// export const MemberList = async ({ members }: { members: any[] }) => {
//   const fetchMemberDetails = members
//     .map(async (member) => {
//       const userFetch = await fetch(
//         `https://xgyzcbqe9i.execute-api.us-east-1.amazonaws.com/user?id=${member.tag
//           .slice(1)
//           .toUpperCase()}`
//       );
//       const {
//         tag,
//         name,
//         trophies,
//         bestTrophies,
//         wins,
//         losses,
//         battleCount,
//         threeCrownWins,
//         challengeMaxWins,
//         role,
//         donations,
//         donationsReceived,
//         totalDonations,
//         warDayWins,
//         currentPathOfLegendSeasonResult,
//         lastPathOfLegendSeasonResult,
//         bestPathOfLegendSeasonResult,
//       } = await userFetch.json();
//       return {
//         outer: {
//           role,
//           name,
//           trophies,
//         },
//         inner: {
//           tag,
//           wins,
//           losses,
//           battleCount,
//           threeCrownWins,
//           challengeMaxWins,
//           role,
//           donations,
//           donationsReceived,
//           totalDonations,
//           warDayWins,
//         },
//         innerRight: {
//           currentPathOfLegendSeasonResult,
//           lastPathOfLegendSeasonResult,
//           bestPathOfLegendSeasonResult,
//           bestTrophies,
//         },
//       };
//     });

//   const memberDetails = await Promise.all(fetchMemberDetails);

//   return (
//     <Box mt={2} pt={4}>
//       <Typography
//         variant="h3"
//         textAlign={"center"}
//         mb={2}
//         className="gold"
//         fontWeight={"bold"}
//       >
//         Clan Members
//       </Typography>
//       <Grid container>
//         <Grid size={{ xs: 10, md: 8 }} offset={{ xs: 1, md: 2 }}>
//           {memberDetails.map((member) => {
//             if (!member.outer.role) return <div key={'bad-egg'}></div>;
//             return (
//               <Accordion key={member.inner.tag}>
//                 <AccordionSummary
//                   expandIcon={<ExpandMoreIcon />}
//                   style={{ padding: "0.5rem", marginLeft: "0.5rem" }}
//                 >
//                   <Typography variant="h5" className="gold">
//                     {member.outer.name}
//                   </Typography>
//                   &nbsp;
//                   <Typography
//                     variant="subtitle2"
//                     mx={2}
//                     color="secondary"
//                     style={{ display: "flex", flexDirection: "column-reverse" }}
//                   >
//                     {member.outer.role.toUpperCase()}
//                   </Typography>
//                   <Typography
//                     variant="h6"
//                     marginLeft={"auto"}
//                     marginRight={"3rem"}
//                   >
//                     {member.outer.trophies}
//                     &nbsp;
//                     <Image
//                       src={TrophyIcon}
//                       alt="Clan Trophies"
//                       width="15"
//                       height="15"
//                     />
//                   </Typography>
//                 </AccordionSummary>
//                 <AccordionDetails>
//                   <Grid container>
//                     <Grid size={{ xs: 12, md: 6 }}>
//                       {Object.entries(member.inner).map(([key, val]) => (
//                         <Typography
//                           key={`${member.outer.name}-${key}`}
//                           variant="body1"
//                         >
//                           {key}: {val}
//                         </Typography>
//                       ))}
//                     </Grid>
//                     <Grid size={{ xs: 12, md: 6 }}>
//                       <Typography variant="h6">
//                         Path of Legend (Ranked)
//                       </Typography>
//                       <Typography variant="body1">
//                         Current Season: League{" "}
//                         {member.innerRight.currentPathOfLegendSeasonResult
//                           ?.leagueNumber || 0}
//                       </Typography>
//                       <Typography variant="body1">
//                         Last Season: League{" "}
//                         {member.innerRight.lastPathOfLegendSeasonResult
//                           ?.leagueNumber || 0}
//                       </Typography>
//                       <Typography variant="body1">
//                         Best Season: League{" "}
//                         {member.innerRight.bestPathOfLegendSeasonResult
//                           ?.leagueNumber || 0}
//                       </Typography>
//                       <Typography variant="h6" mt={2}>
//                         Trophy Road
//                       </Typography>
//                       <Typography variant="body1">
//                         Best Trophies: {member.innerRight.bestTrophies}
//                       </Typography>
//                     </Grid>
//                   </Grid>
//                 </AccordionDetails>
//               </Accordion>
//             );
//           })}
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };
