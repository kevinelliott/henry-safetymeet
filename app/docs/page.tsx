export default function DocsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">API Documentation</h1>
      <p className="text-gray-600 mb-12">Integrate SafetyMeet into your workforce management system.</p>
      <div className="space-y-8">
        {[
          { method: "GET", path: "/api/meetings", desc: "List all meetings for authenticated user" },
          { method: "POST", path: "/api/meetings", desc: "Create a new safety meeting", body: '{ "title": "string", "topic": "string", "scheduled_at": "ISO 8601" }' },
          { method: "GET", path: "/api/meetings/[id]", desc: "Get meeting + attendances by ID" },
          { method: "POST", path: "/api/meetings/[id]/attend", desc: "Worker attendance submission (public)", body: '{ "worker_name": "string", "signature": "base64", "token": "string" }' },
          { method: "GET", path: "/api/meetings/[id]/export", desc: "Export attendance CSV (auth required)" },
        ].map((e) => (
          <div key={e.path} className="border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-sm font-mono font-bold ${e.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{e.method}</span>
              <code className="text-gray-800 font-mono">{e.path}</code>
            </div>
            <p className="text-gray-600 mb-2">{e.desc}</p>
            {e.body && <pre className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-700">{e.body}</pre>}
          </div>
        ))}
      </div>
    </main>
  )
}
