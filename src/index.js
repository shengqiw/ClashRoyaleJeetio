import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap";
import ReactGA from "react-ga";
// import $ from 'jquery';
// import Popper from 'popper.js';
import "bootstrap/dist/js/bootstrap.bundle.min";

ReactGA.initialize("UA-174270954-1");
// import Rules from './components/Rules'
ReactDOM.render(<App />, document.getElementById("root"));
// ReactDOM.render(<Rules />, document.getElementById('root'));
