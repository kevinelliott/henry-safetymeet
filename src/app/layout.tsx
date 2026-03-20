import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafetyMeet — OSHA Compliance",
  description:
    "OSHA Safety Meeting & Toolbox Talk Compliance Management System. Track worker acknowledgments, generate QR codes, and maintain compliance records.",
  keywords: "OSHA, safety meeting, toolbox talk, compliance, worker safety",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-safety-navy min-h-screen text-slate-100 antialiased">
        {/* Navigation */}
        <nav className="bg-safety-slate border-b border-slate-700 sticky top-0 z-50 backdrop-blur-sm bg-slate-800/95">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo / Brand */}
              <Link
                href="/"
                className="flex items-center gap-3 group"
              >
                <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/30 group-hover:bg-orange-400 transition-colors">
                  🦺
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-bold text-lg tracking-tight">
                    SafetyMeet
                  </span>
                  <span className="text-orange-400 text-xs font-medium tracking-wider uppercase">
                    OSHA Compliance
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2"
                    />
                  </svg>
                  Dashboard
                </NavLink>
                <NavLink href="/meetings/new">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Meeting
                </NavLink>
                <NavLink href="/compliance">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Compliance
                </NavLink>
              </div>

              {/* Mobile menu - simplified */}
              <div className="flex md:hidden items-center gap-2">
                <Link
                  href="/"
                  className="text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors"
                  title="Dashboard"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <Link
                  href="/meetings/new"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New
                </Link>
                <Link
                  href="/compliance"
                  className="text-slate-400 hover:text-orange-400 p-2 rounded-lg transition-colors"
                  title="Compliance"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <span className="text-lg">🦺</span>
                <span>SafetyMeet &copy; {new Date().getFullYear()}</span>
                <span className="text-slate-700">|</span>
                <span>OSHA Compliance Made Simple</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>⚠️ All safety meetings must be documented</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 text-slate-400 hover:text-orange-400 hover:bg-slate-700/50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
    >
      {children}
    </Link>
  );
}
