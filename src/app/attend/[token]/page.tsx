"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { AttendanceTokenWithWorkerAndMeeting } from "@/types";

type PageState = "loading" | "not_found" | "pending" | "already_acknowledged" | "just_acknowledged" | "error";

export default function AttendPage() {
  const params = useParams();
  const token = params.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [tokenData, setTokenData] = useState<AttendanceTokenWithWorkerAndMeeting | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchToken();
  }, [token]);

  async function fetchToken() {
    try {
      const { data, error } = await supabase
        .from("attendance_tokens")
        .select("*, workers(*), meetings(*)")
        .eq("token", token)
        .single();

      if (error || !data) {
        setPageState("not_found");
        return;
      }

      setTokenData(data);

      if (data.acknowledged_at !== null) {
        setPageState("already_acknowledged");
      } else {
        setPageState("pending");
      }
    } catch (err) {
      console.error("Error fetching token:", err);
      setPageState("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleAcknowledge() {
    if (!tokenData || acknowledging) return;
    setAcknowledging(true);
    setError(null);

    try {
      const response = await fetch("/api/attend/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to acknowledge");
      }

      if (result.already_acknowledged) {
        setPageState("already_acknowledged");
      } else if (result.success) {
        // Update local state
        setTokenData((prev) =>
          prev
            ? {
                ...prev,
                acknowledged_at: new Date().toISOString(),
                shift_cleared: true,
              }
            : prev
        );
        setPageState("just_acknowledged");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit acknowledgment");
    } finally {
      setAcknowledging(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading safety briefing...</p>
        </div>
      </div>
    );
  }

  // ── Not Found ─────────────────────────────────────────────
  if (pageState === "not_found") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">❌</div>
          <h1 className="text-3xl font-black text-white mb-4">
            Invalid Link
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            This attendance link is invalid or has expired. Please ask your
            supervisor for a new link.
          </p>
          <div className="p-4 bg-amber-900/30 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 text-sm">
              ⚠️ Each worker has a unique attendance link. Make sure you are
              using the correct link for your name.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">⚠️</div>
          <h1 className="text-3xl font-black text-white mb-4">
            Something Went Wrong
          </h1>
          <p className="text-slate-400 text-lg mb-4">
            Unable to load your attendance record. Please try again.
          </p>
          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-4 py-2 mb-6">
              {error}
            </p>
          )}
          <button
            onClick={fetchToken}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Already Acknowledged ──────────────────────────────────
  if (pageState === "already_acknowledged" && tokenData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success Banner */}
          <div className="bg-green-900/40 border-2 border-green-500/60 rounded-2xl p-8 text-center mb-6 shadow-2xl shadow-green-500/10">
            <div className="text-7xl mb-4">✅</div>
            <h1 className="text-3xl font-black text-green-300 mb-2">
              Already Acknowledged
            </h1>
            <p className="text-green-400 text-lg">
              You are cleared for your shift.
            </p>
          </div>

          {/* Details */}
          <div className="card space-y-4">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Worker</p>
              <p className="text-white font-bold text-xl mt-1">
                {tokenData.workers.name}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Meeting</p>
              <p className="text-white font-semibold mt-1">
                {tokenData.meetings.title}
              </p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Acknowledged At</p>
              <p className="text-green-400 font-semibold mt-1">
                {tokenData.acknowledged_at
                  ? format(
                      new Date(tokenData.acknowledged_at),
                      "EEEE, MMMM d, yyyy 'at' h:mm a"
                    )
                  : "—"}
              </p>
            </div>
          </div>

          <p className="text-center text-slate-600 text-sm mt-6">
            🦺 Your attendance has been recorded for OSHA compliance.
          </p>
        </div>
      </div>
    );
  }

  // ── Just Acknowledged (Success) ───────────────────────────
  if (pageState === "just_acknowledged" && tokenData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Big Success */}
          <div className="bg-green-900/40 border-2 border-green-500/60 rounded-2xl p-8 text-center mb-6 shadow-2xl shadow-green-500/20">
            <div
              className="text-8xl mb-4"
              style={{ animation: "warning-pulse 1s ease-in-out 3" }}
            >
              ✅
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-green-300 mb-3">
              You Are Cleared
              <br />
              For Your Shift!
            </h1>
            <p className="text-green-400 text-lg">
              Safety briefing acknowledged successfully.
            </p>
          </div>

          {/* Confirmation Details */}
          <div className="card space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-lg font-bold text-green-400">
                {tokenData.workers.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-white text-lg">
                  {tokenData.workers.name}
                </p>
                {tokenData.workers.employee_id && (
                  <p className="text-slate-400 text-sm">
                    {tokenData.workers.employee_id}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                Safety Meeting
              </p>
              <p className="text-white font-semibold">
                {tokenData.meetings.title}
              </p>
            </div>

            {tokenData.meetings.description && (
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                  Topics Covered
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {tokenData.meetings.description}
                </p>
              </div>
            )}

            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-300 text-sm font-medium">
                ✅ Acknowledged:{" "}
                {tokenData.acknowledged_at
                  ? format(
                      new Date(tokenData.acknowledged_at),
                      "MMM d, yyyy 'at' h:mm a"
                    )
                  : format(new Date(), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6 px-4">
            🦺 Your acknowledgment has been recorded for OSHA compliance
            documentation. Keep this page as confirmation.
          </p>
        </div>
      </div>
    );
  }

  // ── Pending — NOT Cleared ─────────────────────────────────
  if (pageState === "pending" && tokenData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* NOT CLEARED Warning Banner */}
          <div className="bg-red-900/50 border-2 border-red-500 rounded-2xl p-6 text-center mb-6 shadow-2xl shadow-red-500/20">
            {/* Hazard stripe at top */}
            <div
              className="h-3 rounded-t-xl mb-6 -mx-6 -mt-6 rounded-t-2xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #F97316, #F97316 10px, #1a1a1a 10px, #1a1a1a 20px)",
              }}
            />
            <div className="text-6xl mb-3 warning-pulse">⚠️</div>
            <h1 className="text-2xl sm:text-3xl font-black text-red-300 uppercase tracking-tight mb-2">
              NOT CLEARED
              <br />
              FOR SHIFT
            </h1>
            <p className="text-red-400">
              You must acknowledge this safety briefing before starting work.
            </p>
          </div>

          {/* Meeting Info */}
          <div className="card space-y-5 mb-6">
            {/* Worker Info */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-700">
              <div className="w-14 h-14 bg-orange-500/20 rounded-full flex items-center justify-center text-xl font-black text-orange-400 flex-shrink-0">
                {tokenData.workers.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  Worker
                </p>
                <p className="text-white font-black text-2xl leading-tight">
                  {tokenData.workers.name}
                </p>
                {tokenData.workers.employee_id && (
                  <p className="text-slate-400 text-sm">
                    ID: {tokenData.workers.employee_id}
                  </p>
                )}
              </div>
            </div>

            {/* Meeting Details */}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                Safety Meeting
              </p>
              <p className="text-white font-bold text-xl leading-tight">
                {tokenData.meetings.title}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
                Scheduled
              </p>
              <p className="text-orange-400 font-semibold">
                {format(
                  new Date(tokenData.meetings.scheduled_at),
                  "EEEE, MMMM d, yyyy"
                )}
              </p>
              <p className="text-slate-400 text-sm">
                {format(new Date(tokenData.meetings.scheduled_at), "h:mm a")}
              </p>
            </div>

            {tokenData.meetings.description && (
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-2">
                  Briefing Topics
                </p>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {tokenData.meetings.description}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-300 text-sm font-medium">
                ⚠️ By acknowledging, you confirm that you have attended and
                understood this safety briefing. This record will be kept for
                OSHA compliance documentation.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-4 flex items-start gap-3">
              <span className="text-red-400">❌</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* THE Big Acknowledge Button */}
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-black text-lg sm:text-xl py-6 px-8 rounded-2xl transition-all duration-150 shadow-2xl shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              textShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          >
            {acknowledging ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              <span className="flex flex-col items-center gap-1">
                <span className="text-2xl">🦺</span>
                <span>I Acknowledge Attending</span>
                <span className="text-orange-200 text-base font-semibold">
                  This Safety Briefing
                </span>
              </span>
            )}
          </button>

          <p className="text-center text-slate-600 text-xs mt-4 px-4">
            Tap the button above to record your attendance and clear yourself
            for shift work. This action cannot be undone.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
