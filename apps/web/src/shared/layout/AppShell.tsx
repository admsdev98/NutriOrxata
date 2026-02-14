import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
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
            <NavLink className={({ isActive }) => navItemClassName(isActive)} to="/worker">
              Worker
            </NavLink>
            <NavLink className={({ isActive }) => navItemClassName(isActive)} to="/health">
              Health
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
