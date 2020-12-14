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
                        <h6>Bestest Awesomest Coolest Clan EVER!</h6>
                        <h6>Email: jeetioclash@gmail.com</h6>
                        <Link to="/Reesh">
                            <h6 className="">Follow us on jeetsagram :p</h6>
                        </Link>
                    </Col>
                    <Col>
                        <p className="text-center">&copy; 2019 jeetio.com</p>
                    </Col>
                </Row>

            </Container>
        </div>
    );
}