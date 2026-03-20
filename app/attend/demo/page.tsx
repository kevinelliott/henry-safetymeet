"use client";

import { useRef, useState } from "react";

const DEMO_MEETING = {
  title: "Fall Protection Toolbox Talk",
  topic_category: "fall_protection",
  site_name: "Riverside Tower Project",
  meeting_date: new Date().toISOString().split("T")[0],
  description: `FALL PROTECTION REQUIREMENTS — Today's Briefing

1. All work at heights of 6 feet or more requires fall protection.
2. Inspect your harness before every use — check for frayed straps, broken buckles, or damaged D-rings.
3. Ensure anchor points are rated for at least 5,000 lbs per worker.
4. Self-retracting lifelines (SRLs) must be attached above your head.
5. Report any near-miss incidents to your supervisor immediately.
6. Never "shock load" your harness — if it has arrested a fall, take it out of service.

Questions? Ask your supervisor before starting work.`,
};

export default function DemoPage() {
  const [workerName, setWorkerName] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 text-xs px-3 py-1 rounded-full font-medium mb-6">
            ⚡ DEMO MODE — No data was saved
          </div>
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Signed Off!</h1>
          <p className="text-gray-600 mb-4">
            <strong>{workerName || "Demo Worker"}</strong>, your attendance has been recorded.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left mb-6">
            <div className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">
              Confirmation Details
            </div>
            <div className="space-y-1 text-sm text-gray-700">
              <div><span className="font-medium">Meeting:</span> {DEMO_MEETING.title}</div>
              <div><span className="font-medium">Site:</span> {DEMO_MEETING.site_name}</div>
              <div><span className="font-medium">Date:</span> {new Date(DEMO_MEETING.meeting_date).toLocaleDateString()}</div>
              <div><span className="font-medium">Recorded at:</span> {new Date().toLocaleString()}</div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mb-6">You are cleared for work. Stay safe out there. 🦺</p>
          <button
            onClick={() => { setSubmitted(false); setWorkerName(""); setUnderstood(false); setHasSignature(false); clearSignature(); }}
            className="text-sm text-indigo-600 hover:underline"
          >
            ← Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-700 text-white py-4 px-4 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦺</span>
            <div>
              <div className="font-bold text-base leading-tight">Safety Briefing Sign-Off</div>
              <div className="text-indigo-200 text-xs">SafetyMeet — OSHA Compliant</div>
            </div>
          </div>
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
            DEMO
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 text-sm text-yellow-800 font-medium">
          ⚡ Demo mode — this is a preview of the worker experience. No data will be saved.
        </div>

        {/* Meeting Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{DEMO_MEETING.title}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full font-medium">
              🏗️ Fall Protection
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              📍 {DEMO_MEETING.site_name}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              📅 {new Date(DEMO_MEETING.meeting_date).toLocaleDateString()}
            </span>
          </div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Briefing Content — Read Before Signing
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {DEMO_MEETING.description}
          </div>
        </div>

        {/* Sign-Off Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-gray-900 text-base">Worker Sign-Off</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="First and last name"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">
                Signature <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {hasSignature && (
                <button type="button" onClick={clearSignature} className="text-xs text-gray-400 hover:text-red-500">
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

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer" onClick={() => setUnderstood(!understood)}>
              <div className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${understood ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"}`}>
                {understood && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-indigo-800 leading-snug">
                I confirm that I attended this safety meeting, I have read and understood the briefing content, and I am aware of the safety requirements for my work today.
              </span>
            </label>
          </div>

          <button
            onClick={() => {
              if (workerName.trim() && understood) setSubmitted(true);
            }}
            disabled={!workerName.trim() || !understood}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ✍️ Sign Off & Confirm Attendance
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Your sign-off is recorded with a timestamp for OSHA compliance. SafetyMeet.
        </p>
      </main>
    </div>
  );
}
