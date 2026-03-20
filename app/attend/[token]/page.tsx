"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Meeting, Attendance } from "@/types";

interface Props {
  params: Promise<{ token: string }>;
}

export default function AttendPage({ params }: Props) {
  const [token, setToken] = useState<string>("");
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [closed, setClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workerName, setWorkerName] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Attendance | null>(null);
  const [error, setError] = useState("");
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const supabase = getSupabaseClient();

  // Resolve params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    supabase
      .from("meetings")
      .select("*")
      .eq("token", token)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setNotFound(true);
        } else if (data.status === "closed") {
          setMeeting(data);
          setClosed(true);
        } else {
          setMeeting(data);
        }
        setLoading(false);
      });
  }, [token, supabase]);

  // Signature canvas helpers
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    lastPosRef.current = getPos(e, canvas);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    const last = lastPosRef.current;
    if (!last) return;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPosRef.current = pos;
    setHasSignature(true);
  };

  const endDraw = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !workerName.trim()) return;
    if (!understood) {
      setError("Please confirm you understood the safety briefing.");
      return;
    }
    setSubmitting(true);
    setError("");

    let signatureData: string | null = null;
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      signatureData = canvas.toDataURL("image/png");
    }

    const { data, error: err } = await supabase
      .from("attendances")
      .insert({
        meeting_id: meeting.id,
        worker_name: workerName.trim(),
        worker_signature: signatureData,
        understood: true,
      })
      .select()
      .single();

    if (err) {
      setError("Failed to submit. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(data);
    setSubmitting(false);
  };

  const categoryLabel: Record<string, string> = {
    fall_protection: "🏗️ Fall Protection",
    electrical: "⚡ Electrical Safety",
    fire_safety: "🔥 Fire Safety",
    hazmat: "🧪 Hazardous Materials",
    ppe: "🦺 PPE & Equipment",
    first_aid: "🏥 First Aid",
    site_safety: "🚧 Site Safety",
    general: "🛡️ General Safety",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Not Found</h1>
          <p className="text-gray-500">This link doesn&apos;t match any safety meeting. Please check with your supervisor.</p>
        </div>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Closed</h1>
          <p className="text-gray-500 max-w-sm">
            This safety meeting has been closed by your supervisor. Sign-offs are no longer being accepted.
          </p>
          {meeting && (
            <p className="text-sm text-gray-400 mt-4">
              {meeting.title} — {new Date(meeting.meeting_date).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signed Off!</h1>
          <p className="text-gray-600 mb-6">
            <strong>{submitted.worker_name}</strong>, your attendance has been recorded.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left mb-6">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">
              Confirmation Details
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div><span className="font-medium">Meeting:</span> {meeting?.title}</div>
              {meeting?.site_name && (
                <div><span className="font-medium">Site:</span> {meeting.site_name}</div>
              )}
              <div>
                <span className="font-medium">Date:</span>{" "}
                {meeting ? new Date(meeting.meeting_date).toLocaleDateString() : ""}
              </div>
              <div>
                <span className="font-medium">Recorded at:</span>{" "}
                {new Date(submitted.acknowledged_at).toLocaleString()}
              </div>
            </div>
          </div>

          {submitted.worker_signature && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2 font-medium">Your Signature:</div>
              <img
                src={submitted.worker_signature}
                alt="Your signature"
                className="h-16 mx-auto rounded border border-gray-100 bg-white p-1"
              />
            </div>
          )}

          <p className="text-sm text-gray-400">
            You are cleared for work. Stay safe out there. 🦺
          </p>
        </div>
      </div>
    );
  }

  if (!meeting) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white py-4 px-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <span className="text-2xl">🦺</span>
          <div>
            <div className="font-bold text-base leading-tight">Safety Briefing Sign-Off</div>
            <div className="text-indigo-200 text-xs">SafetyMeet — OSHA Compliant</div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Meeting Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{meeting.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
              {categoryLabel[meeting.topic_category] || meeting.topic_category}
            </span>
            {meeting.site_name && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                📍 {meeting.site_name}
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              📅 {new Date(meeting.meeting_date).toLocaleDateString()}
            </span>
          </div>

          {meeting.description ? (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Briefing Content — Read Before Signing
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {meeting.description}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              ⚠️ Your supervisor has conducted this safety briefing verbally. Sign below to confirm you attended and understood.
            </div>
          )}
        </div>

        {/* Sign-Off Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-900 text-base">Worker Sign-Off</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="First and last name"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="name"
            />
          </div>

          {/* Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Signature <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {hasSignature && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative">
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-300 text-sm">Sign here</span>
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Draw your signature using finger or mouse</p>
          </div>

          {/* Acknowledgement */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={understood}
                  onChange={(e) => setUnderstood(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    understood
                      ? "bg-indigo-600 border-indigo-600"
                      : "bg-white border-gray-300"
                  }`}
                  onClick={() => setUnderstood(!understood)}
                >
                  {understood && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-indigo-800 leading-snug">
                I confirm that I attended this safety meeting, I have read and understood the briefing content, and I am aware of the safety requirements for my work today.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !workerName.trim() || !understood}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </span>
            ) : (
              "✍️ Sign Off & Confirm Attendance"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 pb-6">
          Your sign-off is recorded with a timestamp for OSHA compliance. SafetyMeet.
        </p>
      </main>
    </div>
  );
}
