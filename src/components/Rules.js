import React from 'react'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { CardDefault, CardImage } from './card'
import { rulesReq, rulesKeep, rulesKick, rulesSoft } from '../json/temp2'
import { Princess } from '../json/temp'

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

// import {
//     BrowserRouter as Router,
//     Switch,
//     Route,
//     Link
// } from "react-router-dom";

// export default function Rules() {
//     return (
//         <Router>
//             <div>
//                 <nav>
//                     <ul>
//                         <li>
//                             <Link to="/">Home</Link>
//                         </li>
//                         <li>
//                             <Link to="/about">About</Link>
//                         </li>
//                         <li>
//                             <Link to="/users">Users</Link>
//                         </li>
//                     </ul>
//                 </nav>

//                 {/* A <Switch> looks through its children <Route>s and
//             renders the first one that matches the current URL. */}
//                 <Switch>
//                     <Route path="/about">
//                         <About />
//                     </Route>
//                     <Route path="/users">
//                         <Users />
//                     </Route>
//                     <Route path="/">
//                         <Home />
//                     </Route>
//                 </Switch>
//             </div>
//         </Router>
//     );
// }

// function Home() {
//     return <h2>Home</h2>;
// }

// function About() {
//     return <h2>About</h2>;
// }

// function Users() {
//     return <h2>Users</h2>;
// }