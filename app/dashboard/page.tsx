"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";
import type { Meeting, Attendance } from "@/types";

type MeetingWithAttendances = Meeting & { attendances: Attendance[] };

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [meetings, setMeetings] = useState<MeetingWithAttendances[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithAttendances | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const loadMeetings = useCallback(async (userId: string) => {
    const supabase = getSupabaseClient();
    const { data: meetingsData } = await supabase
      .from("meetings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (meetingsData) {
      const meetingsWithAttendances = await Promise.all(
        meetingsData.map(async (meeting: Meeting) => {
          const { data: attendances } = await supabase
            .from("attendances")
            .select("*")
            .eq("meeting_id", meeting.id)
            .order("acknowledged_at", { ascending: false });
          return { ...meeting, attendances: attendances || [] };
        })
      );
      setMeetings(meetingsWithAttendances);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadMeetings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadMeetings(session.user.id);
      } else {
        setUser(null);
        setMeetings([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadMeetings]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const supabase = getSupabaseClient();

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const closeMeeting = async (meetingId: string) => {
    const supabase = getSupabaseClient();
    await supabase.from("meetings").update({ status: "closed" }).eq("id", meetingId);
    if (user) loadMeetings(user.id);
  };

  const stats = {
    total: meetings.length,
    thisWeek: meetings.filter((m) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(m.created_at) > weekAgo;
    }).length,
    totalSignoffs: meetings.reduce((acc, m) => acc + m.attendances.length, 0),
    avgAttendance:
      meetings.length > 0
        ? Math.round(
            meetings.reduce((acc, m) => acc + m.attendances.length, 0) /
              meetings.length
          )
        : 0,
  };

  const categoryLabel: Record<string, string> = {
    fall_protection: "Fall Protection",
    electrical: "Electrical Safety",
    fire_safety: "Fire Safety",
    hazmat: "Hazardous Materials",
    ppe: "PPE & Equipment",
    first_aid: "First Aid",
    site_safety: "Site Safety",
    general: "General Safety",
  };

  const categoryColor: Record<string, string> = {
    fall_protection: "bg-orange-100 text-orange-700",
    electrical: "bg-yellow-100 text-yellow-700",
    fire_safety: "bg-red-100 text-red-700",
    hazmat: "bg-purple-100 text-purple-700",
    ppe: "bg-blue-100 text-blue-700",
    first_aid: "bg-green-100 text-green-700",
    site_safety: "bg-indigo-100 text-indigo-700",
    general: "bg-gray-100 text-gray-700",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <span className="text-4xl">🦺</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-3">
              SafetyMeet Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isSignUp ? "Create your account" : "Sign in to manage your safety meetings"}
            </p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {authLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); }}
              className="text-indigo-600 font-medium hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up free"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl">🦺</span>
                <span className="font-bold text-gray-900">SafetyMeet</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 text-sm">Dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 hidden sm:block">{user.email}</span>
              <Link
                href="/meetings/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + New Safety Meeting
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Meetings", value: stats.total, icon: "📋", color: "text-indigo-600" },
            { label: "This Week", value: stats.thisWeek, icon: "📅", color: "text-green-600" },
            { label: "Total Sign-offs", value: stats.totalSignoffs, icon: "✍️", color: "text-blue-600" },
            { label: "Avg Attendance", value: stats.avgAttendance, icon: "👷", color: "text-orange-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Meetings Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">Safety Meetings</h2>
            <Link
              href="/meetings/new"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + Create New
            </Link>
          </div>

          {meetings.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No safety meetings yet
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                Create your first toolbox talk and get workers signed off in minutes.
              </p>
              <Link
                href="/meetings/new"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Create First Meeting
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Site
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Category
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sign-offs
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">
                          {meeting.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-600">
                          {meeting.site_name || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">
                          {new Date(meeting.meeting_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            categoryColor[meeting.topic_category] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {categoryLabel[meeting.topic_category] || meeting.topic_category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600">
                          <span className="text-base">✍️</span>
                          {meeting.attendances.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            meeting.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {meeting.status === "active" ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <a
                            href={`/attend/${meeting.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-600 hover:underline font-medium"
                          >
                            Link
                          </a>
                          {meeting.status === "active" && (
                            <button
                              onClick={() => closeMeeting(meeting.id)}
                              className="text-xs text-red-500 hover:underline font-medium"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Side Panel */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSelectedMeeting(null)}
          />
          <div className="w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg truncate">
                {selectedMeeting.title}
              </h3>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Meeting Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Site</div>
                  <div className="text-sm font-medium text-gray-800">
                    {selectedMeeting.site_name || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Date</div>
                  <div className="text-sm font-medium text-gray-800">
                    {new Date(selectedMeeting.meeting_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Category</div>
                  <div className="text-sm font-medium text-gray-800">
                    {categoryLabel[selectedMeeting.topic_category] || selectedMeeting.topic_category}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      selectedMeeting.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {selectedMeeting.status === "active" ? "Active" : "Closed"}
                  </span>
                </div>
              </div>

              {selectedMeeting.description && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Briefing Content</div>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-4 leading-relaxed">
                    {selectedMeeting.description}
                  </p>
                </div>
              )}

              {/* QR / Link */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-indigo-700 mb-3">
                  Worker Sign-Off Link
                </div>
                <div className="flex gap-4 items-start">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/attend/${selectedMeeting.token}`
                    )}`}
                    alt="QR Code"
                    className="w-20 h-20 rounded border border-white shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-indigo-600 font-mono break-all bg-white rounded-lg px-3 py-2 border border-indigo-100 mb-2">
                      {typeof window !== "undefined" ? window.location.origin : ""}/attend/{selectedMeeting.token}
                    </div>
                    <a
                      href={`/attend/${selectedMeeting.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline font-medium"
                    >
                      Open in new tab →
                    </a>
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Attendees ({selectedMeeting.attendances.length})
                  </h4>
                  {selectedMeeting.attendances.length > 0 && (
                    <a
                      href={`/api/meetings/${selectedMeeting.id}/export`}
                      onClick={async (e) => {
                        e.preventDefault();
                        const sb = getSupabaseClient();
                        const { data: { session } } = await sb.auth.getSession();
                        if (!session) return;
                        const res = await fetch(`/api/meetings/${selectedMeeting.id}/export`, {
                          headers: { Authorization: `Bearer ${session.access_token}` },
                        });
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = res.headers.get("content-disposition")?.split('filename="')[1]?.replace('"', '') || "export.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg font-medium hover:bg-green-100 transition-colors"
                    >
                      📊 Export CSV
                    </a>
                  )}
                </div>

                {selectedMeeting.attendances.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl">
                    No sign-offs yet. Share the link with workers.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedMeeting.attendances.map((att) => (
                      <div
                        key={att.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900 text-sm">
                            {att.worker_name}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(att.acknowledged_at).toLocaleString()}
                          </span>
                        </div>
                        {att.worker_signature && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-400 mb-1">Signature:</div>
                            <img
                              src={att.worker_signature}
                              alt={`${att.worker_name} signature`}
                              className="h-12 bg-white rounded border border-gray-100 p-1"
                            />
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <span>✓</span>
                          <span>Understood &amp; acknowledged</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
