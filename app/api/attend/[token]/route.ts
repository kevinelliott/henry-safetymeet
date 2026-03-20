import { NextRequest } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("id, title, topic_category, description, meeting_date, site_name, status, token")
    .eq("token", token)
    .single();

  if (error || !meeting) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  return Response.json(meeting);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = getSupabaseServiceClient();

  // Get meeting
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id, status")
    .eq("token", token)
    .single();

  if (meetingError || !meeting) {
    return Response.json({ error: "Meeting not found" }, { status: 404 });
  }

  if (meeting.status === "closed") {
    return Response.json({ error: "This meeting is closed" }, { status: 403 });
  }

  const body = await request.json();
  const { worker_name, worker_signature, understood } = body;

  if (!worker_name) {
    return Response.json({ error: "Worker name is required" }, { status: 400 });
  }

  // Get worker IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const worker_ip = forwarded ? forwarded.split(",")[0].trim() : null;

  const { data, error } = await supabase
    .from("attendances")
    .insert({
      meeting_id: meeting.id,
      worker_name: worker_name.trim(),
      worker_signature: worker_signature || null,
      worker_ip,
      understood: understood !== false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
