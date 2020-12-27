import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import streamLogo from '../images/deejandhadeslogo.jpg'
import twitch from '../images/twitch.png'
import discord from '../images/discord.png'
import twitter from '../images/twitter.png'
import youtube from '../images/youtube.png'

const twitchUrl = "https://www.twitch.tv/clashwithdeejandhades";
const discordUrl = "https://discord.gg/bRMb8sB";
const twitterUrl = "https://twitter.com/DeeJandHades";
const youtubeUrl = "https://www.youtube.com/channel/UCkMFJCWZNqCmVqIykR5Hn7Q";

const mappingAround = new Map([
        [twitchUrl, twitch], 
        [discordUrl, discord], 
        [twitterUrl, twitter], 
        [youtubeUrl, youtube]
    ]);

const clickableImage = (url) => (
    <a href={url} rel="noopener noreferrer" target="_blank">
        <img style={{ height: "110px", maxWidth: "100%"}} 
            src={mappingAround.get(url)} alt={url} className="rounded hoverzoom" />
    </a>
);


export default function Stream() {
    return (
            <Container fluid={true} style={{ height: '100%' }}>
                    <Row className='pl-3 pr-3 transparent' style={{ height: '100%' }}>
                        <Col className='m-0 p-0 text-center' style={{height: "100%"}} 
                            md={{ span: 12 }} xl={{ span: 4 }}>
                            <img style={{ height: "100%", maxWidth: "100%", objectFit: 'cover', objectPosition: 'center center'}} 
                                src={streamLogo} alt='deejandhades' className="rounded" />
                        </Col>
                        <Col className='m-0 text-center' style={{ height: '100%' }}
                            md={{span: 12}} xl={{span: 8}}>
                            <Row>
                                <Col className="col-10 offset-1 mt-5 mb-4 bg-light rounded">
                                    <h2 className='text-warning'>ClashWithDeejAndHades</h2>
                                    <h5 className='text-primary'>Chill dudes that love Clash!</h5>
                                    <ul className='text-left text-secondary'>
                                        <li>Pros and Semi Pros are invited to the channel constantly</li>
                                        <li>Friendly battles with viewers and prized tourneys!</li>
                                        <li>HIGH ENERGY + AWESOME CONTENT</li>
                                    </ul>
                                    <h6><b>Check Out Their Videos and Social Media Below!</b></h6>
                                </Col>
                            </Row>
                            <Row>
                                <Col>
                                    {clickableImage(twitchUrl)}
                                </Col>
                                <Col>
                                    {clickableImage(discordUrl)}
                                </Col>
                                <Col>
                                    {clickableImage(twitterUrl)}
                                </Col>
                                <Col>
                                    {clickableImage(youtubeUrl)}
                                </Col>
                            </Row>
                        </Col>
                    </Row>
            </Container>
    );
}
            