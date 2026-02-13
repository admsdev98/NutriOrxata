import AppRoutes from "./routes";
import AppShell from "../shared/layout/AppShell";

export default function App() {
  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  );
}
