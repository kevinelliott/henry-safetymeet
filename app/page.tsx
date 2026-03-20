"use client";

import Link from "next/link";

const topicCategories = [
  { icon: "🏗️", label: "Fall Protection", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { icon: "⚡", label: "Electrical Safety", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { icon: "🔥", label: "Fire Safety", color: "bg-red-50 text-red-700 border-red-200" },
  { icon: "🧪", label: "Hazardous Materials", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { icon: "🦺", label: "PPE & Equipment", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { icon: "🏥", label: "First Aid", color: "bg-green-50 text-green-700 border-green-200" },
  { icon: "🚧", label: "Site Safety", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
];

const howItWorks = [
  {
    step: "1",
    title: "Create a Safety Meeting",
    desc: "Set your topic, site, date, and briefing details in under 2 minutes.",
    icon: "📋",
  },
  {
    step: "2",
    title: "Share QR Code or Link",
    desc: "Workers scan the QR code with any phone — no app download needed.",
    icon: "📱",
  },
  {
    step: "3",
    title: "Workers Sign Off",
    desc: "Each worker enters their name, signs, and confirms they understood the briefing.",
    icon: "✍️",
  },
  {
    step: "4",
    title: "Instant Audit Trail",
    desc: "Download a timestamped attendance report for OSHA compliance in one click.",
    icon: "📊",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦺</span>
              <span className="font-bold text-xl text-gray-900">SafetyMeet</span>
              <span className="hidden sm:inline ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                OSHA Compliant
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/attend/demo"
                className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                See Demo
              </Link>
              <Link
                href="/dashboard"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            OSHA Top Citation — Construction Sites
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            OSHA Violation: <span className="text-red-400">$15,625.</span>
            <br />
            Safety Meeting:{" "}
            <span className="text-green-400">5 Minutes.</span>
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl mx-auto mb-10">
            Digital toolbox talks with worker sign-off. Instant OSHA audit
            trail. Workers acknowledge on their phone — no clipboard, no lost
            paper.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-white text-indigo-700 font-bold px-8 py-4 rounded-xl text-lg hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              href="/attend/demo"
              className="border-2 border-white/40 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors"
            >
              See Worker View →
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-12 px-4 border-b border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              value: "$15,625",
              label: "OSHA safety meeting violation per incident",
              color: "text-red-600",
            },
            {
              value: "#1",
              label: "Top citation on construction sites every year",
              color: "text-orange-600",
            },
            {
              value: "Lost",
              label: "Paper sign-in sheets — no defense in audit",
              color: "text-yellow-600",
            },
            {
              value: "Instant",
              label: "Digital records = instant OSHA audit response",
              color: "text-green-600",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <div className={`text-3xl font-extrabold mb-2 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-gray-600 text-sm leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gatekeeper callout */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-red-800 mb-3">
              Worker Not Cleared Until Briefing Confirmed
            </h2>
            <p className="text-red-700 text-base max-w-xl mx-auto">
              Every worker must acknowledge the safety briefing before starting
              work. SafetyMeet creates a digital record of who confirmed, when,
              and what they acknowledged — protecting your crew and your company.
            </p>
          </div>
        </div>
      </section>

      {/* Topic Categories */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Every Toolbox Talk Topic Covered
            </h2>
            <p className="text-gray-600">
              Pre-organized categories for fast meeting setup
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {topicCategories.map((cat, i) => (
              <div
                key={i}
                className={`border-2 rounded-xl p-4 text-center hover:shadow-md transition-shadow cursor-default ${cat.color}`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-xs font-semibold leading-tight">
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              From brief to signed record in under 5 minutes
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <div
                key={i}
                className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  {step.step}
                </div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.desc}
                </p>
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-4 text-gray-300 text-2xl">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why SafetyMeet?
            </h2>
            <p className="text-gray-600">See how we compare to old-school methods</p>
          </div>
          <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-200">
            <table className="w-full bg-white">
              <thead>
                <tr className="bg-indigo-600 text-white">
                  <th className="text-left px-6 py-4 font-semibold">Feature</th>
                  <th className="px-6 py-4 font-semibold text-center">SafetyMeet</th>
                  <th className="px-6 py-4 font-semibold text-center">Paper Sign-In</th>
                  <th className="px-6 py-4 font-semibold text-center">iAuditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["Mobile worker sign-off (no app)", "✅", "❌", "⚠️ App required"],
                  ["QR code sharing", "✅", "❌", "⚠️ Paid tier"],
                  ["Instant OSHA audit report", "✅", "❌", "✅"],
                  ["Digital signature capture", "✅", "❌", "✅"],
                  ["No paper — no lost records", "✅", "❌", "✅"],
                  ["Simple setup (< 2 min)", "✅", "✅", "❌ Complex"],
                  ["Affordable for small contractors", "✅", "✅", "❌ $$$"],
                  ["Real-time attendance tracking", "✅", "❌", "✅"],
                ].map(([feature, sm, paper, ia], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 text-gray-800 font-medium text-sm">{feature}</td>
                    <td className="px-6 py-4 text-center text-sm">{sm}</td>
                    <td className="px-6 py-4 text-center text-sm">{paper}</td>
                    <td className="px-6 py-4 text-center text-sm">{ia}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-indigo-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">
            Stop Gambling With OSHA Compliance
          </h2>
          <p className="text-indigo-100 text-lg mb-8">
            One citation costs more than years of SafetyMeet. Protect your
            business and your crew — starting today.
          </p>
          <Link
            href="/dashboard"
            className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-xl text-lg hover:bg-indigo-50 transition-colors shadow-lg"
          >
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-lg">🦺</span>
          <span className="text-white font-semibold">SafetyMeet</span>
        </div>
        <p>OSHA-Compliant Safety Meeting Software for Construction &amp; Industry</p>
        <p className="mt-2 text-gray-600">
          © {new Date().getFullYear()} SafetyMeet. Built for field crews.
        </p>
      </footer>
    </div>
  );
}
