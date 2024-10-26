export const ClanInfo = ({clan}: {clan: Object}) => {
  return (
    <ul>
      {Object.entries(clan).map(([key, value]) => (
        <li key={key}>
          {key}: {JSON.stringify(value)}
        </li>
      ))}
    </ul>
  )
};
