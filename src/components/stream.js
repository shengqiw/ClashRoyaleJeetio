import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'


export default function Stream() {
    return (
        <React.Fragment>
            <Container>
                <Row><Col className="bg-white" md={{ span: 12 }} xl={{ span: 8, offset: 2 }}>
                    <img style={{ objectFit: "fill", width: "100%" }} src={require("../images/deejhades.PNG")} alt='deejandhades' />
                    <h4>Twitch Stream</h4>
                    <a href="https://www.twitch.tv/clashwithdeejandhades" rel="noopener noreferrer" target="_blank">Visit Stream</a>
                    <h4>Discord Channel</h4>
                    <a href="https://discord.gg/bRMb8sB" rel="noopener noreferrer" target="_blank">Discord Link</a>
                    <h4>Youtube Videos</h4>
                    <a href="https://www.youtube.com/channel/UCkMFJCWZNqCmVqIykR5Hn7Q" rel="noopener noreferrer" target="_blank">Check Videos</a>
                    <h4>Twitter Updates</h4>
                    <a href="https://twitter.com/DeeJandHades" rel="noopener noreferrer" target="_blank">Live Updates</a>

                </Col></Row>
            </Container>
        </React.Fragment >
    );
}