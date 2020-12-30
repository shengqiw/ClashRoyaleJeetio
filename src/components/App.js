import React, { Component } from 'react'
import MyNavbar from './navbar'
import Footer from './footer'
import { BG } from '../json/image-info'
import '../index.css'
import { Router, Route, Redirect } from 'react-router-dom'
import Home from './Home'
import Rules from './Rules'
import Promotion from './promotion'
import Stream from './stream'
import Tournament from './tournament'
import funfunfun from './reesh/index'
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
    componentWillMount() {
        this.unlisten = history.listen((location, action) => {
            ReactGA.pageview(window.location.pathname)
        });
    }
    componentWillUnmount() {
        this.unlisten();
    }

    render() {
        return (
            <Router history={history}>
                <MyNavbar />
                <div style={BG}>
                    <Route exact path="/Home" component={Home} />
                    <Route exact path="/Rules" component={Rules} />
                    <Route exact path="/Promotion" component={Promotion} />
                    <Route exact path="/Stream" component={Stream} />
                    <Route exact path="/Tournament" component={Tournament} />
                    <Route exact path="/Reesh" component={funfunfun} />
                    <Route exact path="/">
                        <Redirect to="/Home" />
                    </Route>
                </div>
                <Footer />
                <ScrollToTop />
            </Router>
        )
    }
};