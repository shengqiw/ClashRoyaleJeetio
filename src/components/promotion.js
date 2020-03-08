import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Divider from './divider'
import { CardText } from './card'
import { ModalCoLeader } from './modal'
import {
    // promotionHeader,
    promotionElder,
    promotionCoLeader,
    promotionCoLeaderTrials
} from '../json/promotion-info'

export default function Promotion() {
    const [modalShow, setModalShow] = React.useState(false);
    console.log(modalShow)
    return (
        <React.Fragment>
            <Container className="bg-white rounded">
                <Row>
                    <Col className="m-4 ml-5 mt-5">
                        <h2>Promotions</h2>
                        {/* <Divider /> */}
                        {/* <CardText oof={promotionHeader} /> */}
                        <h4 className="mt-4">Elder</h4>
                        <Divider />
                        <CardText oof={promotionElder} />
                        <h4 className="mt-2">Co-Leader</h4>
                        <Divider />
                        <CardText oof={promotionCoLeader} />
                        <h4 className="mt-2">Co-Leader Trials</h4>
                        <Divider />
                        <CardText oof={promotionCoLeaderTrials} />
                        <ModalCoLeader show={modalShow} onHide={() => setModalShow(false)} />
                    </Col>
                </Row>

            </Container>

        </React.Fragment>
    );
}


