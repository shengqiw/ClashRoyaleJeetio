import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Divider from './divider'

export default function Tournament() {

    return (
        <Container fluid={true}>
            <Row>
                <Col className="bg-white rounded" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>
                    <Row>
                        <Col className="m-5">
                            <h2 className="text-center">Jeetio 2s Tournament</h2>
                            <Divider />
                            <h4 className="m-4">What is a 2s tournament?</h4>
                            <ul>
                                <li>Find a partner within the clan to team up with</li>
                                <li>Each team will be assigned a TEAM NUMBER (don't forget this lol)</li>
                                <li>Teams will be split into 2 to 4 divisional groups</li>
                                <li>*based on number of participants*</li>
                                <li>Winners of each division will then face off in placement round</li>
                                <li>Winners of the placement rounds will earn prizes!</li>
                            </ul>
                            <Divider />
                            <h4 className="m-3">First Round</h4>
                            <ul>
                                <li>Each divisonal group will face other teams within their divison</li>
                                <li>We will generate random numbers corresponding to team numbers to face off for each round</li>
                                <li>3 losses and you are out!</li>
                                <li>team with most wins will proceed to the placement rounds</li>
                            </ul>
                            <h4 className="m-3">Placement Round</h4>
                            <ul>
                                <li>Winners from each divison will face off in a best of 3</li>
                                <li>If there are 2 teams, then winner takes first and loser takes second</li>
                                <li>If there are 4 teams, then we will have two placement rounds</li>
                                <li>First round will be best of 3 against another team, the winners and losers of each game respectively will face off in another best of 3.</li>
                                <li>Team that wins both rounds will place first.</li>
                                <li>Team that wins the first game but loses the second will place second</li>
                                <li>Team that loses the first game and wins the second game will place third</li>
                                <li>If you lose both games, you will place 4th</li>
                            </ul>
                            <div className="ml-3">
                                <h5>Divisonal rounds based on participants</h5>
                                <ul>
                                    <li>If we have less than 8 teams, we will have 2 divisons</li>
                                    <li>If we have at least 8 teams, we will have 4 divisons</li>
                                </ul>
                            </div>
                            <ul className="ml-3">
                                <li>1st place team gets $40 dollars</li>
                                <li>2nd place team gets $20 dollars</li>
                                <li>3rd place team gets $10 dollars</li>
                                <li>Money will be split 50/50 amongst teamate</li>
                            </ul>
                            <Divider />
                            <h4 className="m-3">How will I get my rewards?</h4>
                            <h6 className="ml-3">The gift cards will be purchased on amazon as an e-gift card. It will need an email address as the recipient.</h6>
                            <h6 className="ml-3">LET US KNOW IF YOU ARE NOT FROM USA, because itunes giftcards are per country basis.</h6>
                            <h6 className="ml-3">LET US KNOW IF YOU HAVE ANDROID, because itunes giftcards will be a book placeholder.</h6>
                            <h6 className="ml-3">If you won a reward, just give us a email you have access to</h6>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    )
}

{/* <Container fluid={true}>
    <Row>
        <Col className="bg-white rounded" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>
            <Row>
                <Col className="m-5">
                    <h2 className="text-center">Jeetio Tournament</h2>
                    <Divider />
                    <h4 className="m-4">How does it work?</h4>
                    <ul>
                        <li>Wait for a clan message from a founding father</li>
                        <li>Join the clan tournament</li>
                        <li>Win as many battles at you can</li>
                        <li>Founding fathers <b>won't</b> earn rewards</li>
                    </ul>
                    <Divider />
                    <h4 className="m-3">Rewards?</h4>
                    <div className="ml-3">
                        <h5>Less than 12 participants</h5>
                        <h6 className="ml-3">Top 2 finishers will earn rewards</h6>
                    </div>
                    <ul>
                        <li>1st place gets $10 dollar itunes gift card</li>
                        <li>2nd place gets $5 dollar itunes gift card</li>
                    </ul>
                    <div className="ml-3">
                        <h5>12 or more participants</h5>
                        <h6 className="ml-3">Top 3 finishers will earn rewards</h6>
                    </div>
                    <ul className="ml-3">
                        <li>1st place gets $10 dollar itunes gift card</li>
                        <li>2nd place gets $5 dollar itunes gift card</li>
                        <li>3rd place $5 dollar itunes gift card</li>
                    </ul>
                    <Divider />
                    <h4 className="m-3">How will I get my rewards?</h4>
                    <h6 className="ml-3">The gift cards will be purchased on amazon as an e-gift card. It will need an email address as the recipient.</h6>
                    <h6 className="ml-3">If you won a reward, just give us a email you have access to</h6>
                </Col>
            </Row>
        </Col>
    </Row>
</Container> */}