import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import ScrollToTop from "./components/scrollToTop/index.jsx";
import ScrollTopButton from "./components/scrollToTopButton/index.jsx";
import "./index.scss";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
      <ScrollTopButton />
    </BrowserRouter>
  </React.StrictMode>
);