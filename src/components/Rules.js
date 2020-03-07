import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { CardDefault, CardImage } from './card'
import { rulesReq, rulesKeep, rulesKick, rulesSoft } from '../json/rules-info'
import { Princess } from '../json/image-info'

export default function Rules() {
    return (
        <React.Fragment>
            <Container>
                <Row>
                    <Col md={{ span: 12 }}>
                        <CardImage oof={Princess} />
                    </Col>
                </Row>
                <Row className="mt-5">
                    <Col md={{ span: 6 }}>
                        <CardDefault oof={rulesReq} />
                    </Col>
                    <Col md={{ span: 6 }}>
                        <CardDefault oof={rulesKeep} />
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col md={{ span: 6 }}>
                        <CardDefault oof={rulesKick} />
                    </Col>
                    <Col md={{ span: 6 }}>
                        <CardDefault oof={rulesSoft} />
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    );
}
