import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <div className="bg-primary" style={{ height: "150px" }}>
            <Container>
                <Row className='pt-5'>
                    <Col md={{ span: 5, offset: 1 }}>
                        <h5>Bestest Awesomest Coolest Clan EVER!</h5>
                        <p>&copy; 2019 jeetio.com</p>
                        <Link to="/Reesh">
                            <h6 className="">Follow us on jeetsagram :p</h6>
                        </Link>
                    </Col>
                    <Col className='text-right'>
                        <a href='https://discord.gg/ZhRz4F8eVF'>
                        <h5 className='text-white'>Click Here to Join Our Discord!</h5>
                        </a>
                        <h5>Email: jeetioclash@gmail.com</h5>
                    </Col>
                </Row>

            </Container>
        </div>
    );
}