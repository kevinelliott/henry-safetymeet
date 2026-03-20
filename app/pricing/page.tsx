export default function PricingPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Simple Pricing</h1>
        <p className="text-xl text-gray-600">Less than the cost of one OSHA citation.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Free", price: "$0", desc: "Try it out", features: ["1 job site", "Up to 10 workers", "Basic meeting templates", "PDF export"] },
          { name: "Site", price: "$29/mo", desc: "For one job site", features: ["Unlimited workers", "Unlimited meetings", "QR code sign-in", "CSV export", "Shift gating", "Email support"], highlight: true },
          { name: "Company", price: "$79/mo", desc: "Multiple locations", features: ["Everything in Site", "Unlimited job sites", "Team management", "OSHA audit reports", "API access", "Priority support"] },
        ].map((tier) => (
          <div key={tier.name} className={`rounded-2xl border p-8 ${tier.highlight ? "border-indigo-600 shadow-lg ring-2 ring-indigo-600" : "border-gray-200"}`}>
            <h2 className="text-2xl font-bold text-gray-900">{tier.name}</h2>
            <p className="text-gray-500 mt-1">{tier.desc}</p>
            <p className="text-4xl font-bold text-gray-900 mt-4">{tier.price}</p>
            <ul className="mt-8 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-gray-700">
                  <span className="text-indigo-600 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href="/dashboard" className={`mt-8 block text-center py-3 rounded-lg font-semibold ${tier.highlight ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
              Get Started
            </a>
          </div>
        ))}
      </div>
    </main>
  )
}
