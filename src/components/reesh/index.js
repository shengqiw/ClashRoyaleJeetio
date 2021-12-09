import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container'
import { fetchClan } from './fetchShit'


const getClanElement = (clan) => {    
    return (
        <div style={{textAlign: 'center'}}>
            <p>{clan.tag}</p>
            {
                clan.memberList.map((member) => (
                    <div key={member.name} style={{display: 'inline-block', margin: '5px', padding: '5px', border: '1px solid gray', width: '40vw'}}>
                        <h5>{member.name}</h5>
                        <small>Clan Rank #{member.clanRank} - {member.role}</small>
                        <h6>{member.trophies} Trophies - {member.arena.name}</h6>
                        <h6>{member.donations} Donations</h6>
                    </div>
                ))
            }
        </div>
    )
}

export default function Clan() {
    const [clanInfo, setClanInfo] = useState(<h4>loading...</h4>);

    useEffect(() => {
        fetchClan().then(response => {
            const clanElement = getClanElement(response.data);
            setClanInfo(clanElement);
        })
    }, []);
    
    return (
        <Container fluid={true} style={{backgroundColor: 'white', padding: '5px'}}>
            <h3 style={{position: 'relative', textAlign: 'center'}}>Jeetio Clan</h3>
            {clanInfo}

        </Container >
    );
}