import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
            <Container fluid={true} className='bg-primary'>
                <Row className='pt-5 pb-2'>
                    <Col md={{ span: 5, offset: 1 }}>
                        <h4>Bestest Awesomest Coolest Clan EVER!</h4>
                        <h4>&copy; 2019 jeetio.com</h4>
                        <Link to="/Reesh">
                            <h6 className="">Follow us on jeetsagram :p</h6>
                        </Link>
                    </Col>
                    <Col md={{span: 5}} className='text-right'>
                        <a href='https://discord.gg/ZhRz4F8eVF'>
                        <h4 className='text-white'>Click Here to Join Our Discord!</h4>
                        </a>
                        <h4>Email: jeetioclash@gmail.com</h4>
                    </Col>
                </Row>
            </Container>
    );
}