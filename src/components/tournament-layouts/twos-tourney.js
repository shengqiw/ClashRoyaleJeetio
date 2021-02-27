import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Divider from '../divider'
import bracket from '../../images/bracket-feb.PNG'

export const twosTourney = () => {
    return (
        <Container fluid={true}>
            <Row>
                <Col className="bg-white rounded" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>

                    <Row>
                        <Col>
                            <h3 className='m-5 '>Tourney Bracket</h3>
                            {/* <h6 className='m-5'>Will be displayed after signups are finished</h6> */}
                            <img className='img-fluid' src={bracket} alt='poop'></img>
                        </Col>

                    </Row>
                    <Row>
                        <Col className="m-5">
                            <h2 className="text-center">Jeetio 2s Tournament</h2>

                            <Divider />
                            <h4 className="m-4">Rules</h4>
                            <ul>
                                <li>Find a partner within the clan (Or risk it with a random)</li>
                                <li>Each team will be assigned a TEAM NUMBER (don't forget this lol)</li>
                                <li>Teams will compete in a bracket system</li>
                                <li>Each round teams will face off in a best of 3</li>
                                <li>Top 3 teams will earn prizes</li>
                            </ul>

                            <Divider />
                            <h4 className="m-3">Team Registration</h4>
                            <ul>
                                <li>Sign ups are at the bottom of this page</li>
                                <li>Provide your partner's name if you have one</li>
                                <li>If you do not care who you teammate is, then leave it empty. We will randomly assign one</li>
                            </ul>

                            <Divider />
                            <h4 className="m-3">Team Number</h4>
                            <ul>
                                <li>We will use a Random Number Generator to assign each team a number</li>
                                <li>Team numbers will be assigned once registrations close</li>
                                <li>The brackets will then be built</li>
                                <li>We will upload the bracket to the website afterwards</li>
                            </ul>

                            <Divider />
                            <h4 className="ml-3">How will the games be played?</h4>
                            <ul>
                                <li>Since it is a best of 3 for each matchup, we will have all teams play concurrently for each round</li>
                                <li>After all teams have finished their BO3, then we will proceed to the next round and so on</li>
                            </ul>
                            <Divider />
                            <h4 className="ml-3">Prizes for top finishers</h4>
                            <ul>
                                <li>1st place team gets $50 dollars</li>
                                <li>2nd place team gets $30 dollars</li>
                                <li>3rd place team gets $20 dollars</li>
                                {/* <li>Exact $$ amount are still being decided by founders, will update ASAP</li> */}
                                <li>Money will be split 50/50 amongst teamate</li>

                            </ul>
                            <Divider />
                            <h4 className="m-3">How will I get my rewards?</h4>
                            <h6 className="ml-3">The gift cards will be purchased on amazon as an e-gift card. It will need an email address as the recipient.</h6>
                            <h6 className="ml-3">LET US KNOW IF YOU ARE NOT FROM USA, because itunes giftcards are per country basis.</h6>
                            <h6 className="ml-3">LET US KNOW IF YOU HAVE ANDROID, because itunes giftcards will be a book placeholder.</h6>
                            <h6 className="ml-3">If you won a reward, just give us a email you have access to</h6>
                            <h6 className="ml-3">** We have recently introduced Paypal and Venmo as options **</h6>
                        </Col>
                    </Row>

                    {/* <Row>
                        <Col>
                            <h3 className='ml-5'>Sign Ups</h3>
                            <iframe title="December" src="https://docs.google.com/forms/d/e/1FAIpQLSeHleUzny4aDRd_mQrSHejbJzxxQJCmlF4IuY_Pl_re___PVg/viewform?embedded=true" width="100%" height="1950" frameBorder="0" marginheight="0" marginwidth="0">Loading…</iframe>
                        </Col>
                    </Row> */}

                </Col>
            </Row>
        </Container >
    )
}