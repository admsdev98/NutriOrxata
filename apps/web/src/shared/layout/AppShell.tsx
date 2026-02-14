import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  const location = useLocation();
  const pathname = location.pathname;

  const isLibrary = pathname.startsWith("/worker/library");
  const isWorker = pathname.startsWith("/worker") && !isLibrary;
  const isHealth = pathname.startsWith("/health");

  function navItemClassName(isActive: boolean): string {
    if (isActive) {
      return "text-white";
    }
    return "text-neutral-300 hover:text-white";
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm font-semibold tracking-wide">
            NutriOrxata
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link className={navItemClassName(isWorker)} to="/worker">
              Worker
            </Link>
            <Link className={navItemClassName(isLibrary)} to="/worker/library/food">
              Library
            </Link>
            <Link className={navItemClassName(isHealth)} to="/health">
              Health
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
