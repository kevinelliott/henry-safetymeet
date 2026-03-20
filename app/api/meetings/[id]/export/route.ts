import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  // Get auth token from header
  const authHeader = request.headers.get("authorization");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!authHeader || !anonKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  // Verify user owns this meeting
  const { createClient } = await import("@supabase/supabase-js");
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get meeting
  const { data: meeting, error: meetingErr } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (meetingErr || !meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }

  // Get attendances
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("meeting_id", id)
    .order("acknowledged_at", { ascending: true });

  const rows = attendances || [];

  // Build CSV
  const csvLines: string[] = [
    // Header block
    `SAFETYMEET — OSHA SAFETY MEETING ATTENDANCE RECORD`,
    ``,
    `Meeting Title,${escapeCSV(meeting.title)}`,
    `Date,${new Date(meeting.meeting_date).toLocaleDateString()}`,
    `Site,${escapeCSV(meeting.site_name || "")}`,
    `Category,${escapeCSV(meeting.topic_category)}`,
    `Status,${meeting.status}`,
    `Total Sign-offs,${rows.length}`,
    `Export Generated,${new Date().toISOString()}`,
    ``,
    // Attendance table
    `#,Worker Name,Sign-Off Time,Understood,Signature Captured`,
    ...rows.map((att, i) =>
      [
        i + 1,
        escapeCSV(att.worker_name),
        new Date(att.acknowledged_at).toLocaleString(),
        att.understood ? "Yes" : "No",
        att.worker_signature ? "Yes" : "No",
      ].join(",")
    ),
  ];

  const csv = csvLines.join("\n");
  const filename = `safetymeet-${meeting.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${meeting.meeting_date}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
