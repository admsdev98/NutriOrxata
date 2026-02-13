import { Route, Routes } from "react-router-dom";

import HealthPage from "../modules/health/pages/HealthPage";
import HomePage from "../modules/home/pages/HomePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  );
}
