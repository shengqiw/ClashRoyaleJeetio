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
import Tournament from './tournament'
import { ScrollToTop } from './scroll-top'
import { createBrowserHistory as createHistory } from 'history'
import ReactGA from 'react-ga'

const history = createHistory()
history.listen(location => {
    ReactGA.set({ page: location.pathname })
    ReactGA.pageview(location.pathname)
})


export default class App extends Component {
    componentDidMount() {
        ReactGA.pageview(window.location.pathname)
    }

    render() {
        return (
            <BrowserRouter history={history}>
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
                        <Route path="/Tournament">
                            <Tournament />
                        </Route>
                    </Switch>
                </div>
                <Footer />
                <Redirect from="/" to="Home" />
                <ScrollToTop />
            </BrowserRouter>
        )
    }
};