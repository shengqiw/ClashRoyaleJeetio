import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Divider from '../divider'

export const normalTourney = () => {
    return (
        < Container fluid={true} >
            <Row>
                <Col className="bg-white rounded" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>
                    <Row>
                        <Col className="ml-5 mr-5 mt-5 mb-3">
                            <h2 className="text-center">Jeetio Tournament</h2>
                            <Divider />
                            <h4 className="m-3">How does it work?</h4>
                            <ul>
                                <li>Wait for a clan message from a founding father</li>
                                <li>Join the clan tournament</li>
                                <li>Win as many battles at you can</li>
                            </ul>
                            <Divider />
                            <h4 className="m-3">Rewards?</h4>
                            <div className="ml-3">
                                <h5 className="ml-3">Top 3 finishers will earn rewards</h5>
                            </div>
                            <ul>
                                <li>1st place gets $60</li>
                                <li>2nd place gets $40</li>
                                <li>3rd place gets $20</li>
                            </ul>
                            <Divider />
                            <h4 className="m-3">Prize Options</h4>
                            <h5 className="ml-3 mb-1">e-Gift cards (iTunes or Google Play)</h5>
                            <p className="ml-5 mb-1">Purchased as US gift card (possibly CA aswell), if you are from outside the US, it might be hard to redeem</p>
                            <h5 className="ml-3 mb-1">Paypal</h5>
                            <p className="ml-5 mb-1">Should be universal, most countries support paypal</p>
                            <h5 className="ml-3 mb-1">Venmo</h5>
                            <p className="ml-5 mb-1">Quick n EZ</p>

                            <Divider />
                            <h4 className="mt-5 ml-4 mb-0">Sign Ups</h4>
                        </Col>
                    </Row>
                    {/* //stupid aws amplify got crappier servers now */}
                    {/* //stupid aws amplify got crappier servers now X 2*/}
                    <Row>
                        <Col className="col-10 offset-1">
                            <iframe title="Tourney" src="https://docs.google.com/forms/d/e/1FAIpQLSfuU565N0Gsiu3YDkEbYrRBw5YFv0divvcAz9uot8v2j084Uw/viewform?embedded=true" width="640" height="921" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container >
    )
}