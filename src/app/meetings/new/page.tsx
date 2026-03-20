"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Worker, CreateMeetingResponse } from "@/types";
import QRCodeComponent from "@/components/QRCode";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

interface TokenResult {
  worker_id: string;
  token: string;
  worker_name: string;
}

export default function NewMeetingPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(
    new Set()
  );
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return format(now, "yyyy-MM-dd'T'HH:mm");
  });
  const [createdBy, setCreatedBy] = useState("");

  const [result, setResult] = useState<CreateMeetingResponse | null>(null);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    try {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("company_id", DEMO_COMPANY_ID)
        .order("name");

      if (error) throw error;
      setWorkers(data || []);
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoadingWorkers(false);
    }
  }

  function toggleWorker(workerId: string) {
    setSelectedWorkerIds((prev) => {
      const next = new Set(prev);
      if (next.has(workerId)) {
        next.delete(workerId);
      } else {
        next.add(workerId);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedWorkerIds(new Set(workers.map((w) => w.id)));
  }

  function clearAll() {
    setSelectedWorkerIds(new Set());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Meeting title is required.");
      return;
    }
    if (!scheduledAt) {
      setError("Scheduled date/time is required.");
      return;
    }
    if (!createdBy.trim()) {
      setError("Supervisor name is required.");
      return;
    }
    if (selectedWorkerIds.size === 0) {
      setError("Please select at least one worker.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/meetings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scheduled_at: new Date(scheduledAt).toISOString(),
          created_by: createdBy.trim(),
          company_id: DEMO_COMPANY_ID,
          worker_ids: Array.from(selectedWorkerIds),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create meeting");
      }

      setResult(data);
      setMeetingId(data.meeting_id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create meeting"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink(token: string) {
    const url = `${siteUrl}/attend/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  }

  // Success state — show QR codes & links
  if (result && meetingId) {
    return (
      <div className="page-container max-w-4xl">
        {/* Success Banner */}
        <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">✅</span>
            <div>
              <h1 className="text-2xl font-bold text-green-300">
                Meeting Created Successfully!
              </h1>
              <p className="text-green-400 text-sm">
                Share the QR codes or links with each worker below.
              </p>
            </div>
          </div>
        </div>

        {/* Meeting Link */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-white">Meeting Details Page</h2>
              <p className="text-slate-400 text-sm">
                View all worker statuses and acknowledgments in real-time
              </p>
            </div>
            <a
              href={`/meetings/${meetingId}`}
              className="btn-primary inline-flex items-center gap-2 text-sm w-fit"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Meeting Dashboard
            </a>
          </div>
        </div>

        {/* Worker Tokens */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-orange-400">🦺</span>
          Worker Attendance Links ({result.tokens.length})
        </h2>
        <p className="text-slate-400 text-sm mb-6">
          Each worker has a unique QR code and link. Print, text, or show these
          to the appropriate worker. Workers scan to acknowledge the safety briefing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.tokens.map((tokenInfo: TokenResult) => {
            const attendUrl = `${siteUrl}/attend/${tokenInfo.token}`;
            const isCopied = copiedToken === tokenInfo.token;

            return (
              <div
                key={tokenInfo.worker_id}
                className="card flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {tokenInfo.worker_name}
                    </h3>
                    <p className="text-slate-400 text-xs font-mono mt-0.5 truncate max-w-[200px]">
                      {tokenInfo.token}
                    </p>
                  </div>
                  <span className="badge-pending">Pending</span>
                </div>

                {/* QR Code */}
                <div className="flex justify-center bg-white rounded-xl p-4">
                  <QRCodeComponent value={attendUrl} size={180} />
                </div>

                {/* URL */}
                <div className="bg-slate-900 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Attendance URL:</p>
                  <p className="text-xs font-mono text-orange-400 break-all">
                    {attendUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(tokenInfo.token)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      isCopied
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={attendUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary py-2 px-3 text-sm inline-flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Print hint */}
        <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-amber-300 font-semibold">Pro Tip</p>
            <p className="text-amber-400/80 text-sm mt-1">
              Use your browser&apos;s print function (Ctrl+P / Cmd+P) to print
              these QR codes on paper for workers who don&apos;t have smartphones.
              Each worker must scan or visit their unique link to acknowledge
              attendance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="page-container max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <span className="text-orange-500">📝</span>
          Schedule Safety Meeting
        </h1>
        <p className="text-slate-400 mt-1">
          Create a toolbox talk or safety meeting and generate unique attendance
          QR codes for each worker.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Details Card */}
        <div className="card space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-700">
            <span className="text-orange-400">📋</span>
            Meeting Details
          </h2>

          <div>
            <label htmlFor="title" className="label">
              Meeting Title <span className="text-orange-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="e.g. Fall Protection Toolbox Talk, Weekly Safety Meeting"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Description / Agenda
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="Topics covered, OSHA standards referenced, hazards discussed..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-slate-500 text-xs mt-1">
              {description.length}/2000 characters
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_at" className="label">
                Date &amp; Time <span className="text-orange-400">*</span>
              </label>
              <input
                id="scheduled_at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label htmlFor="created_by" className="label">
                Supervisor Name <span className="text-orange-400">*</span>
              </label>
              <input
                id="created_by"
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="input-field"
                placeholder="e.g. John Smith"
                required
                maxLength={100}
              />
            </div>
          </div>
        </div>

        {/* Worker Selection Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-orange-400">🦺</span>
              Select Workers
              {selectedWorkerIds.size > 0 && (
                <span className="text-sm font-normal text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-full">
                  {selectedWorkerIds.size} selected
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
              >
                Select all
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {loadingWorkers ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-700/40 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : workers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-3xl mb-2">👷</p>
              <p>No workers found. Add workers to your company first.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {workers.map((worker) => {
                const isSelected = selectedWorkerIds.has(worker.id);
                return (
                  <label
                    key={worker.id}
                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/50"
                        : "bg-slate-700/30 border-slate-700/50 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleWorker(worker.id)}
                      className="w-4 h-4 accent-orange-500 rounded"
                    />
                    <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {worker.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${
                          isSelected ? "text-orange-300" : "text-slate-200"
                        }`}
                      >
                        {worker.name}
                      </p>
                      <p className="text-slate-500 text-xs truncate">
                        {worker.employee_id && `${worker.employee_id} · `}
                        {worker.email || "No email"}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-orange-400 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-xl flex-shrink-0">❌</span>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-base"
          >
            {submitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Meeting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Meeting &amp; Generate QR Codes
              </>
            )}
          </button>
        </div>

        <p className="text-slate-500 text-sm text-center">
          ⚠️ Once created, unique attendance QR codes will be generated for each
          selected worker.
        </p>
      </form>
    </div>
  );
}
