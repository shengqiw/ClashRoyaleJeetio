import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import streamLogo from '../images/deejandhadeslogo.jpg'
import Divider from './divider'
import { YT } from './embeded'
import { mappingAround, YTMap } from '../json/links'
import { TwitterTweetEmbed } from 'react-twitter-embed'

const hakai = (platform) => (
    mappingAround.get(platform)
)

const clickableImage = ({ url, image }) => (
    <a href={url} rel="noopener noreferrer" target="_blank">
        <img style={{ height: "110px", maxWidth: "100%" }}
            src={image} alt={url} className="rounded hoverzoom" />
    </a>
);


export default function Stream() {
    return (
        <Container fluid={true} style={{ height: '100%' }}>
            <Row className='pl-3 pr-3 transparent' style={{ height: '100%' }}>
                <Col className='m-0 p-0 text-center' style={{ height: "100%" }}
                    md={{ span: 12 }} xl={{ span: 4 }}>
                    <img style={{ width: "100%", maxWidth: "100%", objectFit: 'cover', objectPosition: 'center center' }}
                        src={streamLogo} alt='deejandhades' className="rounded" />
                </Col>
                <Col className='m-0 text-center' style={{ height: '100%' }}
                    md={{ span: 12 }} xl={{ span: 8 }}>
                    <Row>
                        <Col className="col-10 offset-1 mt-5 mb-4 bg-light rounded">
                            <h1 className='text-warning'>ClashWithDeejAndHades</h1>
                            <h4 className='text-primary'>Chill dudes that love Clash!</h4>
                            <ul className='text-left text-secondary'>
                                <li><h5>Pros and Semi Pros are invited to the channel constantly</h5></li>
                                <li><h5>Friendly battles with viewers and prized tourneys!</h5></li>
                                <li><h5>HIGH ENERGY + AWESOME CONTENT</h5></li>
                            </ul>
                            <h5 className="mt-3"><b>Check Out Their Videos and Social Media Below!</b></h5>
                        </Col>
                    </Row>
                    <Row className="mb-4 mt-2">
                        <Col>
                            {clickableImage(hakai('twitch'))}
                        </Col>
                        <Col>
                            {clickableImage(hakai('discord'))}
                        </Col>
                        <Col>
                            {clickableImage(hakai('twitter'))}
                        </Col>
                        <Col>
                            {clickableImage(hakai('youtube'))}
                        </Col>
                    </Row>
                </Col>
            </Row>
            <Row style={{ height: '100%' }}>
                <Divider />
            </Row>
            <Row>
                <Col className="transparentWhite col-10 offset-1 mt-5 pt-5">
                    <h1 className="text-dark text-center">Jeetio Videos</h1>
                    <Row>
                        <Col className="col-10 offset-1 text-primary">
                            <h3 className="mt-4">Cornbread defeats #1 Ranked player on ladder</h3>
                            {YT(YTMap.get('beat#1'))}
                            <Divider />

                            <h3 className="mt-4">Gus=Goat</h3>
                            <TwitterTweetEmbed tweetId={'1335998284624764928'} />
                            <Divider />

                            <h3 className="mt-4">Gus Tower Trade Strat</h3>
                            <TwitterTweetEmbed tweetId={'1335019407807029249'} />
                            <Divider />

                            <h3 className="mt-4">First Video Ever Edited - cornbread & jeetchainz</h3>
                            {YT(YTMap.get('first-video'))}
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    );
}
