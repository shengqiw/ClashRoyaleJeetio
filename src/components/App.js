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
                    <Route path="/Home" component={Home} />
                    <Route path="/Rules" component={Rules} />
                    <Route path="/Promotion" component={Promotion} />
                    <Route path="/Stream" component={Stream} />
                    <Route path="/Tournament" component={Tournament} />
                    <Route path="/Reesh" component={funfunfun} />
                </div>
                <Footer />
                <Redirect exact from="/" to="/Home" />
                <ScrollToTop />
            </Router>
        )
    }
};