"use client";

import { useEffect, useState, useMemo } from "react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Meeting, Worker } from "@/types";

const DEMO_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

interface ComplianceRow {
  worker_id: string;
  worker_name: string;
  worker_employee_id: string | null;
  meeting_id: string;
  meeting_title: string;
  scheduled_at: string;
  status: "acknowledged" | "pending";
  acknowledged_at: string | null;
  token: string;
}

interface ComplianceSummary {
  totalRecords: number;
  acknowledged: number;
  pending: number;
  complianceRate: number;
  totalMeetings: number;
  totalWorkers: number;
}

export default function CompliancePage() {
  const [rows, setRows] = useState<ComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchWorker, setSearchWorker] = useState("");
  const [searchMeeting, setSearchMeeting] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "acknowledged" | "pending">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<keyof ComplianceRow>("scheduled_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchComplianceData();
  }, []);

  async function fetchComplianceData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch all meetings for the company
      const { data: meetings, error: meetingsError } = await supabase
        .from("meetings")
        .select("*")
        .eq("company_id", DEMO_COMPANY_ID)
        .order("scheduled_at", { ascending: false });

      if (meetingsError) throw meetingsError;
      if (!meetings || meetings.length === 0) {
        setRows([]);
        return;
      }

      const meetingIds = meetings.map((m: Meeting) => m.id);

      // Fetch all tokens with worker joins
      const { data: tokens, error: tokensError } = await supabase
        .from("attendance_tokens")
        .select("*, workers(*)")
        .in("meeting_id", meetingIds);

      if (tokensError) throw tokensError;

      // Build compliance rows
      const complianceRows: ComplianceRow[] = (tokens || []).map(
        (token: {
          token: string;
          meeting_id: string;
          acknowledged_at: string | null;
          workers: Worker;
        }) => {
          const meeting = meetings.find((m: Meeting) => m.id === token.meeting_id)!;
          return {
            worker_id: token.workers.id,
            worker_name: token.workers.name,
            worker_employee_id: token.workers.employee_id,
            meeting_id: meeting.id,
            meeting_title: meeting.title,
            scheduled_at: meeting.scheduled_at,
            status: token.acknowledged_at !== null ? "acknowledged" : "pending",
            acknowledged_at: token.acknowledged_at,
            token: token.token,
          };
        }
      );

      setRows(complianceRows);
    } catch (err) {
      console.error("Compliance fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }

  // Filtered & sorted rows
  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Worker name search
    if (searchWorker.trim()) {
      const q = searchWorker.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.worker_name.toLowerCase().includes(q) ||
          (r.worker_employee_id?.toLowerCase().includes(q) ?? false)
      );
    }

    // Meeting search
    if (searchMeeting.trim()) {
      const q = searchMeeting.toLowerCase().trim();
      result = result.filter((r) =>
        r.meeting_title.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((r) => r.status === filterStatus);
    }

    // Date range
    if (dateFrom || dateTo) {
      result = result.filter((r) => {
        const date = parseISO(r.scheduled_at);
        if (dateFrom && dateTo) {
          return isWithinInterval(date, {
            start: parseISO(dateFrom),
            end: parseISO(dateTo + "T23:59:59"),
          });
        }
        if (dateFrom) return date >= parseISO(dateFrom);
        if (dateTo) return date <= parseISO(dateTo + "T23:59:59");
        return true;
      });
    }

    // Sorting
    result.sort((a, b) => {
      const aVal = a[sortField] ?? "";
      const bVal = b[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [rows, searchWorker, searchMeeting, filterStatus, dateFrom, dateTo, sortField, sortDir]);

  // Stats summary
  const summary: ComplianceSummary = useMemo(() => {
    const acknowledged = filteredRows.filter((r) => r.status === "acknowledged").length;
    const total = filteredRows.length;
    const uniqueMeetings = new Set(filteredRows.map((r) => r.meeting_id)).size;
    const uniqueWorkers = new Set(filteredRows.map((r) => r.worker_id)).size;

    return {
      totalRecords: total,
      acknowledged,
      pending: total - acknowledged,
      complianceRate: total > 0 ? Math.round((acknowledged / total) * 100) : 0,
      totalMeetings: uniqueMeetings,
      totalWorkers: uniqueWorkers,
    };
  }, [filteredRows]);

  function handleSort(field: keyof ComplianceRow) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function exportCSV() {
    const headers = [
      "Worker Name",
      "Employee ID",
      "Meeting Title",
      "Scheduled At",
      "Status",
      "Acknowledged At",
    ];

    const csvRows = filteredRows.map((r) => [
      `"${r.worker_name}"`,
      `"${r.worker_employee_id || ""}"`,
      `"${r.meeting_title.replace(/"/g, '""')}"`,
      `"${format(parseISO(r.scheduled_at), "yyyy-MM-dd HH:mm")}"`,
      `"${r.status}"`,
      `"${r.acknowledged_at ? format(parseISO(r.acknowledged_at), "yyyy-MM-dd HH:mm") : ""}"`,
    ]);

    const csvContent = [headers.join(","), ...csvRows.map((r) => r.join(","))].join(
      "\n"
    );

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `safetymeet-compliance-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    setSearchWorker("");
    setSearchMeeting("");
    setFilterStatus("all");
    setDateFrom("");
    setDateTo("");
  }

  const SortIcon = ({ field }: { field: keyof ComplianceRow }) => {
    if (sortField !== field)
      return (
        <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    return (
      <svg className={`w-3 h-3 text-orange-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
        />
      </svg>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="text-orange-500">📊</span>
            Compliance Report
          </h1>
          <p className="text-slate-400 mt-1">
            OSHA Safety Meeting Attendance Records — Demo Construction Co.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredRows.length === 0}
          className="btn-primary flex items-center gap-2 w-fit disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-red-400">❌</span>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <SummaryCard label="Records" value={loading ? "..." : summary.totalRecords.toString()} color="blue" />
        <SummaryCard label="Meetings" value={loading ? "..." : summary.totalMeetings.toString()} color="blue" />
        <SummaryCard label="Workers" value={loading ? "..." : summary.totalWorkers.toString()} color="blue" />
        <SummaryCard label="Acknowledged" value={loading ? "..." : summary.acknowledged.toString()} color="green" />
        <SummaryCard label="Pending" value={loading ? "..." : summary.pending.toString()} color={summary.pending > 0 ? "amber" : "green"} />
        <SummaryCard
          label="Rate"
          value={loading ? "..." : `${summary.complianceRate}%`}
          color={summary.complianceRate >= 90 ? "green" : summary.complianceRate >= 70 ? "amber" : "red"}
        />
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h2>
          <button
            onClick={clearFilters}
            className="text-xs text-slate-400 hover:text-orange-400 transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Search worker..."
            value={searchWorker}
            onChange={(e) => setSearchWorker(e.target.value)}
            className="input-field py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Search meeting..."
            value={searchMeeting}
            onChange={(e) => setSearchMeeting(e.target.value)}
            className="input-field py-2 text-sm"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="input-field py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="pending">Pending</option>
          </select>
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-field py-2 text-sm"
            title="From date"
          />
          <input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-field py-2 text-sm"
            title="To date"
          />
        </div>

        {(searchWorker || searchMeeting || filterStatus !== "all" || dateFrom || dateTo) && (
          <p className="text-slate-500 text-sm mt-3">
            Showing {filteredRows.length} of {rows.length} records
          </p>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-700/40 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-xl font-semibold text-slate-300 mb-2">
              No records found
            </h3>
            <p className="text-slate-500">
              {rows.length === 0
                ? "No meetings have been scheduled yet."
                : "No records match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="flex items-center gap-1.5 uppercase text-xs font-semibold tracking-wider hover:text-orange-400 transition-colors"
                      onClick={() => handleSort("worker_name")}
                    >
                      Worker <SortIcon field="worker_name" />
                    </button>
                  </th>
                  <th className="hidden sm:table-cell">
                    <button
                      className="flex items-center gap-1.5 uppercase text-xs font-semibold tracking-wider hover:text-orange-400 transition-colors"
                      onClick={() => handleSort("meeting_title")}
                    >
                      Meeting <SortIcon field="meeting_title" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="flex items-center gap-1.5 uppercase text-xs font-semibold tracking-wider hover:text-orange-400 transition-colors"
                      onClick={() => handleSort("scheduled_at")}
                    >
                      Scheduled <SortIcon field="scheduled_at" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="flex items-center gap-1.5 uppercase text-xs font-semibold tracking-wider hover:text-orange-400 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      Status <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="hidden md:table-cell">
                    <button
                      className="flex items-center gap-1.5 uppercase text-xs font-semibold tracking-wider hover:text-orange-400 transition-colors"
                      onClick={() => handleSort("acknowledged_at")}
                    >
                      Acknowledged At <SortIcon field="acknowledged_at" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={`${row.worker_id}-${row.meeting_id}-${idx}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {row.worker_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{row.worker_name}</p>
                          {row.worker_employee_id && (
                            <p className="text-slate-500 text-xs">
                              {row.worker_employee_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <p className="text-slate-200 max-w-[200px] truncate" title={row.meeting_title}>
                        {row.meeting_title}
                      </p>
                    </td>
                    <td>
                      <p className="text-slate-300 whitespace-nowrap">
                        {format(parseISO(row.scheduled_at), "MMM d, yyyy")}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {format(parseISO(row.scheduled_at), "h:mm a")}
                      </p>
                    </td>
                    <td>
                      {row.status === "acknowledged" ? (
                        <span className="badge-success">✅ Cleared</span>
                      ) : (
                        <span className="badge-pending">⏳ Pending</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {row.acknowledged_at ? (
                        <div>
                          <p className="text-green-400 whitespace-nowrap">
                            {format(parseISO(row.acknowledged_at), "MMM d, yyyy")}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {format(parseISO(row.acknowledged_at), "h:mm a")}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer row count */}
        {!loading && filteredRows.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <p className="text-slate-500 text-sm">
              {filteredRows.length} record{filteredRows.length !== 1 ? "s" : ""}{" "}
              {filteredRows.length !== rows.length && `(filtered from ${rows.length})`}
            </p>
            <button
              onClick={exportCSV}
              className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        )}
      </div>

      {/* OSHA Notice */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <p className="text-slate-300 font-semibold text-sm">OSHA Recordkeeping Notice</p>
          <p className="text-slate-500 text-sm mt-1">
            OSHA 29 CFR 1926.21 requires employers to document safety training.
            Export and retain these compliance records for a minimum of 3 years.
            Use the CSV export for integration with your OSHA recordkeeping system.
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "blue" | "green" | "amber" | "red";
}) {
  const colorMap = {
    blue: "text-blue-400",
    green: "text-green-400",
    amber: "text-amber-400",
    red: "text-red-400",
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
      <div className={`text-2xl font-black ${colorMap[color]}`}>{value}</div>
      <div className="text-slate-500 text-xs mt-1">{label}</div>
    </div>
  );
}
