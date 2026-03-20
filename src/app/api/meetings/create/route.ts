import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { CreateMeetingRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateMeetingRequest = await request.json();

    const { title, description, scheduled_at, created_by, company_id, worker_ids } =
      body;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Meeting title is required" },
        { status: 400 }
      );
    }
    if (!scheduled_at) {
      return NextResponse.json(
        { error: "Scheduled date/time is required" },
        { status: 400 }
      );
    }
    if (!created_by?.trim()) {
      return NextResponse.json(
        { error: "Supervisor name is required" },
        { status: 400 }
      );
    }
    if (!company_id) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }
    if (!worker_ids || worker_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one worker must be selected" },
        { status: 400 }
      );
    }

    // Insert the meeting
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .insert({
        company_id,
        title: title.trim(),
        description: description?.trim() || null,
        scheduled_at,
        created_by: created_by.trim(),
      })
      .select()
      .single();

    if (meetingError) {
      console.error("Meeting insert error:", meetingError);
      return NextResponse.json(
        { error: "Failed to create meeting: " + meetingError.message },
        { status: 500 }
      );
    }

    // Insert attendance tokens for each worker
    const tokenInserts = worker_ids.map((worker_id: string) => ({
      meeting_id: meeting.id,
      worker_id,
    }));

    const { data: tokens, error: tokensError } = await supabase
      .from("attendance_tokens")
      .insert(tokenInserts)
      .select("*, workers(id, name)");

    if (tokensError) {
      console.error("Token insert error:", tokensError);
      // Rollback: delete the meeting
      await supabase.from("meetings").delete().eq("id", meeting.id);
      return NextResponse.json(
        { error: "Failed to create attendance tokens: " + tokensError.message },
        { status: 500 }
      );
    }

    // Build response
    const tokenResults = (tokens || []).map(
      (t: { worker_id: string; token: string; workers: { id: string; name: string } }) => ({
        worker_id: t.worker_id,
        token: t.token,
        worker_name: t.workers.name,
      })
    );

    return NextResponse.json({
      meeting_id: meeting.id,
      tokens: tokenResults,
    });
  } catch (err) {
    console.error("Create meeting error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
