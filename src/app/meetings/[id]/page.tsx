"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Meeting, AttendanceTokenWithWorker } from "@/types";
import QRCodeComponent from "@/components/QRCode";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function MeetingDetailPage() {
  const params = useParams();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [tokens, setTokens] = useState<AttendanceTokenWithWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [expandedQR, setExpandedQR] = useState<string | null>(null);

  const fetchMeetingData = useCallback(async () => {
    try {
      setError(null);

      const [meetingRes, tokensRes] = await Promise.all([
        supabase.from("meetings").select("*").eq("id", meetingId).single(),
        supabase
          .from("attendance_tokens")
          .select("*, workers(*)")
          .eq("meeting_id", meetingId)
          .order("created_at"),
      ]);

      if (meetingRes.error) throw meetingRes.error;
      if (tokensRes.error) throw tokensRes.error;

      setMeeting(meetingRes.data);
      setTokens(tokensRes.data || []);
    } catch (err) {
      console.error("Failed to fetch meeting:", err);
      setError(err instanceof Error ? err.message : "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  }, [meetingId]);

  useEffect(() => {
    fetchMeetingData();

    // Real-time subscription for attendance token updates
    const channel = supabase
      .channel(`meeting-${meetingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "attendance_tokens",
          filter: `meeting_id=eq.${meetingId}`,
        },
        (payload) => {
          setTokens((prev) =>
            prev.map((t) =>
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, fetchMeetingData]);

  async function copyLink(token: string) {
    const url = `${siteUrl}/attend/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="space-y-4">
          <div className="h-12 w-64 bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-32 bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="page-container">
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-8 text-center">
          <p className="text-4xl mb-4">❌</p>
          <h2 className="text-xl font-bold text-red-300 mb-2">
            Meeting Not Found
          </h2>
          <p className="text-red-400 mb-6">{error || "This meeting does not exist."}</p>
          <Link href="/" className="btn-secondary inline-flex">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const acknowledged = tokens.filter((t) => t.acknowledged_at !== null).length;
  const total = tokens.length;
  const pct = total > 0 ? Math.round((acknowledged / total) * 100) : 0;
  const pending = tokens.filter((t) => t.acknowledged_at === null);
  const cleared = tokens.filter((t) => t.acknowledged_at !== null);

  return (
    <div className="page-container max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-orange-400 transition-colors">
          Dashboard
        </Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-300 truncate max-w-xs">{meeting.title}</span>
      </div>

      {/* Meeting Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              {meeting.title}
            </h1>
            {meeting.description && (
              <p className="text-slate-400 mb-4 leading-relaxed">
                {meeting.description}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {format(new Date(meeting.scheduled_at), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Supervisor: <span className="text-white font-medium">{meeting.created_by}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDistanceToNow(new Date(meeting.scheduled_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchMeetingData}
            className="btn-secondary flex items-center gap-2 text-sm w-fit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <span className="text-3xl">👷</span>
          <div className="text-3xl font-black text-white">{total}</div>
          <div className="text-slate-400 text-sm">Total Workers</div>
        </div>
        <div className="stat-card">
          <span className="text-3xl">✅</span>
          <div className="text-3xl font-black text-green-400">{acknowledged}</div>
          <div className="text-slate-400 text-sm">Acknowledged</div>
        </div>
        <div className="stat-card">
          <span className="text-3xl">⏳</span>
          <div className={`text-3xl font-black ${pending.length > 0 ? "text-amber-400" : "text-green-400"}`}>
            {pending.length}
          </div>
          <div className="text-slate-400 text-sm">Pending</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">
            Compliance Progress
          </span>
          <span
            className={`text-lg font-bold ${
              pct === 100 ? "text-green-400" : pct >= 75 ? "text-amber-400" : "text-red-400"
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pct === 100 ? "bg-green-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">
          {acknowledged} of {total} workers have acknowledged this safety briefing
          {pct === 100 && " — All workers cleared! ✅"}
        </p>
      </div>

      {/* Pending Workers */}
      {pending.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-amber-400">⏳</span>
            Pending Acknowledgment ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((token) => {
              const attendUrl = `${siteUrl}/attend/${token.token}`;
              const isCopied = copiedToken === token.token;
              const isExpanded = expandedQR === token.token;

              return (
                <div
                  key={token.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-amber-500/20"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center text-sm font-bold text-amber-300 flex-shrink-0">
                      {token.workers.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{token.workers.name}</p>
                      {token.workers.employee_id && (
                        <p className="text-slate-500 text-xs">{token.workers.employee_id}</p>
                      )}
                    </div>
                    <span className="badge-pending ml-auto sm:ml-0">Pending</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyLink(token.token)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : "bg-slate-600 hover:bg-slate-500 text-slate-200"
                      }`}
                    >
                      {isCopied ? "✅ Copied!" : "📋 Copy Link"}
                    </button>
                    <button
                      onClick={() => setExpandedQR(isExpanded ? null : token.token)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-600 hover:bg-slate-500 text-slate-200 transition-all"
                    >
                      {isExpanded ? "Hide QR" : "Show QR"}
                    </button>
                    <a
                      href={attendUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 transition-all"
                    >
                      Open ↗
                    </a>
                  </div>

                  {isExpanded && (
                    <div className="w-full sm:w-auto flex flex-col items-center gap-2 pt-3 border-t border-slate-700 sm:border-t-0 sm:pt-0">
                      <div className="bg-white rounded-lg p-3">
                        <QRCodeComponent value={attendUrl} size={140} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Acknowledged Workers */}
      {cleared.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-green-400">✅</span>
            Acknowledged ({cleared.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Employee ID</th>
                  <th>Status</th>
                  <th>Acknowledged At</th>
                </tr>
              </thead>
              <tbody>
                {cleared.map((token) => (
                  <tr key={token.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-xs font-bold text-green-400 flex-shrink-0">
                          {token.workers.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <span className="font-medium text-white">
                          {token.workers.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-400">
                        {token.workers.employee_id || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="badge-success">✅ Cleared</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-white">
                          {token.acknowledged_at
                            ? format(
                                new Date(token.acknowledged_at),
                                "MMM d, yyyy h:mm a"
                              )
                            : "—"}
                        </p>
                        {token.acknowledged_at && (
                          <p className="text-slate-500 text-xs">
                            {formatDistanceToNow(
                              new Date(token.acknowledged_at),
                              { addSuffix: true }
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-4">👷</p>
          <p className="text-slate-400">No workers were assigned to this meeting.</p>
        </div>
      )}
    </div>
  );
}
