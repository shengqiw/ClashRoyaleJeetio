import React from 'react'
import Container from 'react-bootstrap/Container'
import Button from 'react-bootstrap/Button'
import { fetchCornbread, fetchClan } from './fetchShit'

const getAsyncStuff = async () => {
    const cornbread = await fetchCornbread();
    const jeetioClan = await fetchClan();

}

export default function funfunfun() {
    console.log('in here');
    return (
        <Container fluid={true}>
            <Button variant="primary" onClick={getAsyncStuff}>Fetch Cool Shit</Button>

            

        </Container >
    );
}