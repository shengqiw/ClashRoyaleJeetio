import React, { Component } from 'react'
import MyNavbar from './navbar'
import Footer from './footer'
import { BG } from '../json/temp'
import '../index.css'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import Home from './Home'
import Rules from './Rules'
import Promotion from './promotion'
import { ScrollToTop } from './scroll-top'

export default class App extends Component {
    constructor() {
        super();
        this.state = {
            foundingFathers: ['cornbread', 'bcquinn109', 'JeetChainz', 'Hades', 'Verify']
        }
        console.log("SAD");
    }
    render() {
        return (
            <BrowserRouter>
                <MyNavbar />
                <div style={BG}>
                    <Switch>
                        <Route path="/Home">
                            <Home />
                        </Route>
                        <Route path="/Rules">
                            <Rules />
                        </Route>
                        <Route path="/Promotion">
                            <Promotion />
                        </Route>
                    </Switch>
                </div>
                <Footer />
                <Redirect from="/" to="Home" />
                <ScrollToTop />
            </BrowserRouter>
        );
    }
}