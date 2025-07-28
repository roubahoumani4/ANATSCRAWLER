import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScanListPage from "./pages/ScanListPage";
import ScanDetailsPage from "./pages/ScanDetailsPage";
import OsintNewScan from "./components/dashboard/OsintNewScan";

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/osint-engine/new-scan" element={<OsintNewScan />} />
      <Route path="/osint-engine/scans" element={<ScanListPage />} />
      <Route path="/osint-engine/scans/:scanId" element={<ScanDetailsPage />} />
    </Routes>
  </Router>
);

export default AppRoutes;
