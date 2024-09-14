import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import Bot from "./components/Bot";
import Pvp from "./components/Pvp";
import Redirect from "./components/Redirect";
import PvpCustom from "./components/PvpCustom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/Treasure-Island" element={<HomePage />} />
        <Route path="/bot" element={<Bot />} />
        <Route path="/r/" element={<Pvp />} />
        <Route path="/cr/" element={<PvpCustom />} />
        <Route path="*" element={<Redirect />} />
      </Routes>
    </Router>
  );
};

export default App;
