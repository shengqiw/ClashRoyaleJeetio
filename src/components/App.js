import React, { Component } from 'react'
import MyNavbar from './navbar'
import Footer from './footer'
import { BG } from '../json/image-info'
import '../index.css'
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom'
import Home from './Home'
import Rules from './Rules'
import Promotion from './promotion'
import Guides from './guides'
import { ScrollToTop } from './scroll-top'
import { CRToken } from '../store/get-token'
import axios from 'axios'

export default class App extends Component {
    constructor() {
        super();
        this.state = {
            foundingFathers: ""
        }
        console.log(CRToken)
    }

    async getDataAxios() {
        const response =
            await axios.get("https://api.clashroyale.com/v1/clans/%23PRURJPJP",
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'authorization': `Bearer ${CRToken}`
                    }
                }
            )
        console.log(response.data)
    }
    render() {
        this.getDataAxios()
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
                        <Route path="/Guides">
                            <Guides />
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