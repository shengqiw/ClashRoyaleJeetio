import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import '../index.css'
import { CardImage } from './card'
import { Jungle, BattleHealer, King, Flarney } from '../json/image-info'
import { Link } from 'react-router-dom'


export default function Home() {
    return (
        <Container className='MainBg' fluid={true}>
            <Row>
                <Col xl={{ span: 8, offset: 2 }} sm={{ span: 12 }}>
                    <Link to="/Rules">
                        <CardImage oof={Jungle} />
                    </Link>
                    <Row className="mt-5">
                        <Col md={{ span: 4 }}>
                            <Link to="/Promotion">
                                <CardImage oof={BattleHealer} />
                            </Link>
                        </Col>
                        <Col md={{ span: 4 }}>
                            <Link to="/Stream">
                                <CardImage oof={King} />
                            </Link>
                        </Col>
                        <Col md={{ span: 4 }}>
                            <Link to="/Tournament">
                                <CardImage oof={Flarney} />
                            </Link>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>

    );
}