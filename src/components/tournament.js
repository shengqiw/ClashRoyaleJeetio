import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Divider from './divider'

export default function Tournament() {

    return (
        <>
            <Container fluid={true}>
                <Row>
                    <Col className="bg-white rounded" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>
                        <Row>
                            <Col className="m-5">
                                <h2 className="text-center">Jeetio Tournament</h2>
                                <Divider />
                                <h4 className="m-4">How does it work?</h4>
                                <ul>
                                    <li>Wait for a clan message from a founding father</li>
                                    <li>Join the right tournament</li>
                                    <li>Win as many battles at you can</li>
                                    <li>Founding fathers <b>won't</b> earn rewards</li>
                                </ul>
                                <Divider />
                                <h4 className="m-3">Tournaments Rewards</h4>
                                <div className="ml-3">
                                    <h5>Members only Tournament</h5>
                                    <h6 className="ml-3">Top 2 finishers will earn rewards</h6>
                                </div>
                                <ul>
                                    <li>1st place gets $15 dollar itunes gift card and promotion!</li>
                                    <li>2nd place gets $10 dollar itunes gift card</li>
                                </ul>
                                <div className="ml-3">
                                    <h5>Elders and Co-leaders Tournament</h5>
                                    <h6 className="ml-3">Top 2 finishers will earn rewards</h6>
                                </div>
                                <ul className="ml-3">
                                    <li>1st place gets $20 dollar itunes gift card</li>
                                    <li>2nd place gets $15 dollar itunes gift card</li>
                                </ul>
                                <Divider />
                                <h4 className="m-3">How will I get my rewards?</h4>
                                <h6 className="ml-3">The gift cards will be purchased on amazon as an e-gift card. It will need an email address as the recipient.</h6>
                                <h6 className="ml-3">If you won a reward, just give us a email you have access to</h6>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    )
}