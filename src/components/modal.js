import React, { useState } from 'react'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

export function ModalCoLeader(props) {
    // console.log("Applesauce")

    const [modalShow, setModalShow] = useState(false);
    return (
        <React.Fragment>

            <Button className="m-3" size="sm" variant="info" onClick={() => setModalShow(true)}>
                Founding Fathers
            </Button>
            <Modal size="lg" show={modalShow} onHide={() => setModalShow(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Founding Fathers</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h4>Leaders that started it all</h4>
                    <ul>
                        <li>bcquinn109</li>
                        <li>cornbread</li>
                        <li>Hades</li>
                        <li>JeetChainz</li>
                    </ul>
                    <h4>Honorary Veterans who helped us grow</h4>
                    <ul>
                        <li>CFCBoilers</li>
                        <li>Robbie0304</li>
                        <li>Verify</li>
                    </ul>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => { setModalShow(false) }}>Close</Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
}

