"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Meeting, AttendanceToken } from "@/types";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

interface MeetingWithStats extends Meeting {
  total: number;
  acknowledged: number;
}

interface DashboardStats {
  totalMeetings: number;
  workersCleared: number;
  totalTokens: number;
  complianceRate: number;
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<MeetingWithStats[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalMeetings: 0,
    workersCleared: 0,
    totalTokens: 0,
    complianceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch meetings for this company
      const { data: meetingsData, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .eq("company_id", DEMO_COMPANY_ID)
        .order("scheduled_at", { ascending: false })
        .limit(10);

      if (meetingsError) throw meetingsError;

      if (!meetingsData || meetingsData.length === 0) {
        setMeetings([]);
        setStats({
          totalMeetings: 0,
          workersCleared: 0,
          totalTokens: 0,
          complianceRate: 0,
        });
        return;
      }

      // Fetch all attendance tokens for these meetings
      const meetingIds = meetingsData.map((m: Meeting) => m.id);
      const { data: tokensData, error: tokensError } = await supabase
        .from("attendance_tokens")
        .select("*")
        .in("meeting_id", meetingIds);

      if (tokensError) throw tokensError;

      const tokens: AttendanceToken[] = tokensData || [];

      // Build meeting stats
      const meetingsWithStats: MeetingWithStats[] = meetingsData.map(
        (meeting: Meeting) => {
          const meetingTokens = tokens.filter(
            (t) => t.meeting_id === meeting.id
          );
          return {
            ...meeting,
            total: meetingTokens.length,
            acknowledged: meetingTokens.filter((t) => t.acknowledged_at !== null)
              .length,
          };
        }
      );

      // Compute overall stats (from all meetings, not just recent 10)
      const { data: allTokens } = await supabase
        .from("attendance_tokens")
        .select("acknowledged_at, shift_cleared")
        .in(
          "meeting_id",
          (
            await supabase
              .from("meetings")
              .select("id")
              .eq("company_id", DEMO_COMPANY_ID)
          ).data?.map((m: { id: string }) => m.id) || []
        );

      const totalTokens = allTokens?.length || 0;
      const acknowledgedTokens =
        allTokens?.filter((t) => t.acknowledged_at !== null).length || 0;

      const { count: totalMeetingsCount } = await supabase
        .from("meetings")
        .select("*", { count: "exact", head: true })
        .eq("company_id", DEMO_COMPANY_ID);

      setMeetings(meetingsWithStats);
      setStats({
        totalMeetings: totalMeetingsCount || 0,
        workersCleared: acknowledgedTokens,
        totalTokens,
        complianceRate:
          totalTokens > 0
            ? Math.round((acknowledgedTokens / totalTokens) * 100)
            : 0,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-orange-500">⚠️</span>
            Safety Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Demo Construction Co. — Compliance Overview
          </p>
        </div>
        <Link href="/meetings/new" className="btn-primary inline-flex items-center gap-2 w-fit">
          <svg
            className="w-5 h-5"
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
          Schedule Meeting
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-red-400 text-xl flex-shrink-0">❌</span>
          <div>
            <p className="text-red-300 font-medium">Error loading data</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Meetings"
          value={loading ? "..." : stats.totalMeetings.toString()}
          icon="📋"
          color="blue"
          sublabel="All time"
        />
        <StatCard
          label="Workers Cleared"
          value={loading ? "..." : stats.workersCleared.toString()}
          icon="✅"
          color="green"
          sublabel={`of ${stats.totalTokens} total sign-offs`}
        />
        <StatCard
          label="Compliance Rate"
          value={loading ? "..." : `${stats.complianceRate}%`}
          icon="🦺"
          color={
            stats.complianceRate >= 90
              ? "green"
              : stats.complianceRate >= 70
              ? "amber"
              : "red"
          }
          sublabel={
            stats.complianceRate >= 90
              ? "Excellent compliance"
              : stats.complianceRate >= 70
              ? "Needs improvement"
              : "Critical — take action"
          }
        />
      </div>

      {/* Recent Meetings */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-orange-400">📅</span>
            Recent Meetings
          </h2>
          <Link
            href="/compliance"
            className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
          >
            View all compliance →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-700/40 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <Link href="/meetings/new" className="card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-2xl group-hover:bg-orange-500/30 transition-colors">
              📝
            </div>
            <div>
              <h3 className="font-semibold text-white">New Toolbox Talk</h3>
              <p className="text-slate-400 text-sm">
                Schedule a safety meeting and generate worker QR codes
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-orange-400 ml-auto transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        <Link href="/compliance" className="card-hover group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl group-hover:bg-blue-500/30 transition-colors">
              📊
            </div>
            <div>
              <h3 className="font-semibold text-white">Compliance Report</h3>
              <p className="text-slate-400 text-sm">
                View detailed reports and export CSV for OSHA records
              </p>
            </div>
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-orange-400 ml-auto transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  sublabel,
}: {
  label: string;
  value: string;
  icon: string;
  color: "blue" | "green" | "amber" | "red";
  sublabel?: string;
}) {
  const colorMap = {
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-xs font-medium uppercase tracking-wider ${colorMap[color]} bg-current/10 px-2 py-0.5 rounded`}
          style={{
            backgroundColor:
              color === "green"
                ? "rgba(74,222,128,0.1)"
                : color === "amber"
                ? "rgba(251,191,36,0.1)"
                : color === "red"
                ? "rgba(248,113,113,0.1)"
                : "rgba(96,165,250,0.1)",
          }}
        >
          {label}
        </span>
      </div>
      <div className={`text-4xl font-black ${colorMap[color]} mt-2`}>
        {value}
      </div>
      {sublabel && (
        <p className="text-slate-500 text-xs mt-1">{sublabel}</p>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: MeetingWithStats }) {
  const acknowledgedPct =
    meeting.total > 0
      ? Math.round((meeting.acknowledged / meeting.total) * 100)
      : 0;

  const statusColor =
    acknowledgedPct === 100
      ? "bg-green-500"
      : acknowledgedPct >= 50
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="flex items-center gap-4 p-4 bg-slate-700/30 hover:bg-slate-700/60 rounded-xl transition-all duration-150 border border-slate-700/50 hover:border-orange-500/30 group"
    >
      {/* Status indicator */}
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}
      />

      {/* Meeting info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white group-hover:text-orange-300 transition-colors truncate">
          {meeting.title}
        </h3>
        <p className="text-slate-400 text-sm">
          {format(new Date(meeting.scheduled_at), "MMM d, yyyy 'at' h:mm a")} ·{" "}
          <span className="text-slate-500">
            {formatDistanceToNow(new Date(meeting.scheduled_at), {
              addSuffix: true,
            })}
          </span>
        </p>
      </div>

      {/* Acknowledgment progress */}
      <div className="flex-shrink-0 text-right">
        {meeting.total > 0 ? (
          <>
            <div className="text-sm font-semibold text-white">
              {meeting.acknowledged}
              <span className="text-slate-400">/{meeting.total}</span>
            </div>
            <div className="text-xs text-slate-500">
              {acknowledgedPct}% cleared
            </div>
            <div className="w-24 h-1.5 bg-slate-600 rounded-full mt-1.5">
              <div
                className={`h-full rounded-full transition-all ${statusColor}`}
                style={{ width: `${acknowledgedPct}%` }}
              />
            </div>
          </>
        ) : (
          <span className="text-xs text-slate-500 italic">No workers assigned</span>
        )}
      </div>

      <svg
        className="w-4 h-4 text-slate-600 group-hover:text-orange-400 transition-colors flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📋</div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">
        No meetings scheduled yet
      </h3>
      <p className="text-slate-500 mb-6 max-w-sm mx-auto">
        Schedule your first safety meeting to start tracking worker compliance
        and acknowledgments.
      </p>
      <Link href="/meetings/new" className="btn-primary inline-flex items-center gap-2">
        <svg
          className="w-5 h-5"
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
        Schedule First Meeting
      </Link>
    </div>
  );
}
