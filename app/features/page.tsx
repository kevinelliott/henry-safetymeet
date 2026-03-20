export default function FeaturesPage() {
  const features = [
    { icon: "📋", title: "Digital Toolbox Talks", desc: "Create safety briefings for any topic — fall protection, PPE, chemical handling, equipment operation. Built-in OSHA topic library." },
    { icon: "📱", title: "QR Code Attendance", desc: "Generate a QR code for each meeting. Workers scan on-site — no app download needed. Works on any smartphone." },
    { icon: "🔒", title: "Shift Gating", desc: "Workers cannot be cleared for their shift until they've acknowledged the day's safety briefing. Hard block, not a reminder." },
    { icon: "✍️", title: "Digital Signatures", desc: "Workers sign on their phone. Signatures are timestamped with device + IP — legally defensible attendance record." },
    { icon: "📊", title: "OSHA Audit Trail", desc: "Every meeting, every signature, every attendance record is logged. Export CSV reports for OSHA inspections in one click." },
    { icon: "⚡", title: "Instant Notifications", desc: "Supervisors see attendance in real time. Know who's checked in and who hasn't before the shift starts." },
  ]
  return (
    <main className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Built for OSHA Compliance</h1>
        <p className="text-xl text-gray-600">Every feature designed to protect your workers and your company.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((f) => (
          <div key={f.title} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-gray-600">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
