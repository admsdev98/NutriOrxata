import { Link, Route, Routes } from "react-router-dom";

import HealthPage from "./pages/HealthPage";
import HomePage from "./pages/HomePage";

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm font-semibold tracking-wide">
            NutriOrxata
          </Link>
          <nav className="flex items-center gap-4 text-sm text-neutral-300">
            <Link className="hover:text-white" to="/health">
              Health
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
        </Routes>
      </main>
    </div>
  );
}
