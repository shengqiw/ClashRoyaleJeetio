export const MemberList = ({members}: {members: any[]}) => {
  console.log('members', members[0]);
  return <div>
    {members.map((member) => (
      <h5 key={member.tag}>
        {member.name}
      </h5>
    ))}
  </div>;
};
