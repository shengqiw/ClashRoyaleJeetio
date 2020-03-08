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
                <Row >
                    <Col sm="12" xl="6" className="mt-5">
                        <CardDefault oof={rulesReq} />
                    </Col>
                    <Col sm="12" xl="6" className="mt-5">
                        <CardDefault oof={rulesKeep} />
                    </Col>
                </Row>
                <Row>
                    <Col sm="12" xl="6" className="mt-5">
                        <CardDefault oof={rulesKick} />
                    </Col>
                    <Col sm="12" xl="6" className="mt-5">
                        <CardDefault oof={rulesSoft} />
                    </Col>
                </Row>
            </Container>
        </React.Fragment>
    );
}
