import React from 'react'
import Navbar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import Image from 'react-bootstrap/Image'
import Jeetio from '../images/logo.png'
import '../index.css'
import { Link } from 'react-router-dom'


export default function MyNavbar() {
    const styles = {
        fontSize: '2vh',
        color: 'white'
    }
    return (
        <Navbar className="navbg">
            <Nav.Link as={Link} to="/Home">
                <Image className="ml-2 mr-3" src={Jeetio} style={{ height: '5vh', width: 'auto' }} rounded />
            </Nav.Link>
            <Nav className="mr-auto">
                <Nav.Link as={Link} to="/Rules" className="m-1" style={styles}>Rules</Nav.Link>
                <Nav.Link as={Link} to="/Promotion" className="m-1" style={styles}>Promotions</Nav.Link>
                <Nav.Link as={Link} to="/Guides" className="m-1" style={styles}>Guides</Nav.Link>
            </Nav>

        </Navbar >
    );
}

