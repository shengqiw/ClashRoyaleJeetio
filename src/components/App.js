import React, { useState, useEffect } from 'react'
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
// import { CRToken } from '../store/get-token'

export default function App() {

    const [clanData, setClanData] = useState({});

    async function fetchData() {
        const res = await fetch("https://api.clashroyale.com/v1/clans/%23PRURJPJP", {
            headers: {
                Accept: "application/json",
                Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjY4MzJhYjljLTJjMzYtNDUzNi1iMjNiLTE5OGI3NjQwMGViMCIsImlhdCI6MTU4Mzk3OTg0MSwic3ViIjoiZGV2ZWxvcGVyLzExMTU1OTNkLTgwZDctYThjMS01MTA3LTY1OTQwODIxNDI0MiIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI3NS4xNjIuMTkuMiJdLCJ0eXBlIjoiY2xpZW50In1dfQ.bcKqUe5Z6qA18WPOjFh-qHTeW65jiKtdZWMUkPtwxxq2jNEuAtmCl0dH4wxchk0DFe4jADSif5OBAQQXgSEFGQ"
            }
        });
        res
            .json()
            .then(res => setClanData(res))
            .catch(err => console.log('Errors yo', err));
        console.log('give me something', res);
    }
    useEffect(() => {
        fetchData();
        console.log('clan data', clanData);
    });

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
    )
};