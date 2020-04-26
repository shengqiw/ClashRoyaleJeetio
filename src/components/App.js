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
import Tournament from './tournament'
import { ScrollToTop } from './scroll-top'

export default function App() {



    const [clanData, setClanData] = useState({});
    const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjQ2ZjhmNjk3LTRmYzItNDJmOC1hODU0LWU1YzgyNGI0NDA5ZiIsImlhdCI6MTU4NzMxODQ2OCwic3ViIjoiZGV2ZWxvcGVyLzExMTU1OTNkLTgwZDctYThjMS01MTA3LTY1OTQwODIxNDI0MiIsInNjb3BlcyI6WyJyb3lhbGUiXSwibGltaXRzIjpbeyJ0aWVyIjoiZGV2ZWxvcGVyL3NpbHZlciIsInR5cGUiOiJ0aHJvdHRsaW5nIn0seyJjaWRycyI6WyI3NS4xNjIuNDguMzEiXSwidHlwZSI6ImNsaWVudCJ9XX0.kYiHJ20k12BplKU8M8oBRRv9U-buwtYKH1LiTa6_x1qpqmeRP31E44X8SMkbEIOMbdo_39eJF-aPlLi-iUXEVw"

    async function fetchData() {
        const res = await fetch("https://api.clashroyale.com/v1/clans/%23PRURJPJP", {
            headers: {
                "cache-control": "max-age=120",
                "content-type": "application/json; charset=utf-8",
                "Authorization": `Bearer ${TOKEN}`
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
};