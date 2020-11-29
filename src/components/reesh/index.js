import React from 'react'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { fetchShit } from './fetchShit'

export default function funfunfun() {
    console.log('in here');
    return (
        <Container fluid={true}>
            <Button variant="primary" onClick={fetchShit}>Primary</Button>{' '}
        </Container >
    );
}