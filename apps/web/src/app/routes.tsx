import { Route, Routes } from "react-router-dom";

import HealthPage from "../modules/health/pages/HealthPage";
import HomePage from "../modules/home/pages/HomePage";
import WorkerWorkspacePage from "../modules/worker/pages/WorkerWorkspacePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/worker" element={<WorkerWorkspacePage />} />
      <Route path="/worker/clients/:clientId" element={<WorkerWorkspacePage />} />
      <Route path="/health" element={<HealthPage />} />
    </Routes>
  );
}
