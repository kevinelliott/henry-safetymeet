"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

const topicCategories = [
  { value: "fall_protection", label: "Fall Protection" },
  { value: "electrical", label: "Electrical Safety" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "hazmat", label: "Hazardous Materials" },
  { value: "ppe", label: "PPE & Equipment" },
  { value: "first_aid", label: "First Aid" },
  { value: "site_safety", label: "Site Safety" },
  { value: "general", label: "General Safety" },
];

export default function NewMeetingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ token: string; id: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    topic_category: "general",
    site_name: "",
    meeting_date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError("");

    const supabase = getSupabaseClient();
    const { data, error: err } = await supabase
      .from("meetings")
      .insert({
        ...form,
        user_id: user.id,
      })
      .select()
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setCreated({ token: data.token, id: data.id });
    setLoading(false);
  };

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const attendUrl = created ? `${appUrl}/attend/${created.token}` : "";

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🦺</span>
              <span className="font-bold text-gray-900">SafetyMeet</span>
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/dashboard" className="text-gray-600 text-sm hover:text-indigo-600">
              Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 text-sm">New Meeting</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {created ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Meeting Created!
              </h1>
              <p className="text-gray-600">
                Share this QR code or link with your workers. They can sign off
                from any smartphone.
              </p>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-2xl p-6 text-center mb-6">
              <div className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
                Scan to Sign Off
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(attendUrl)}`}
                alt="QR Code"
                className="w-48 h-48 mx-auto rounded-xl shadow-md border-4 border-white"
              />
            </div>

            {/* Copy Link */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Worker Sign-Off Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={attendUrl}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-700 font-mono"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(attendUrl)}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={attendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center border-2 border-indigo-200 text-indigo-600 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
              >
                Preview Worker View
              </a>
              <Link
                href="/dashboard"
                className="flex-1 text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                New Safety Meeting
              </h1>
              <p className="text-gray-600">
                Set up your toolbox talk and get a shareable link for workers to
                sign off.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meeting Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Fall Protection Toolbox Talk"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Topic Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.topic_category}
                    onChange={(e) => setForm({ ...form, topic_category: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {topicCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Meeting Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.meeting_date}
                    onChange={(e) => setForm({ ...form, meeting_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={form.site_name}
                  onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                  placeholder="e.g., Riverside Tower Project"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Briefing Content / Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  placeholder="Describe the safety topics covered in this meeting. Workers will see this content when they sign off..."
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="flex-1 text-center border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Creating..." : "Create Meeting & Get QR Code"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
