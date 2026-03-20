import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { AcknowledgeRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: AcknowledgeRequest = await request.json();
    const { token } = body;

    if (!token?.trim()) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // First, check if the token exists and whether it's already acknowledged
    const { data: existing, error: fetchError } = await supabase
      .from("attendance_tokens")
      .select("id, acknowledged_at, token")
      .eq("token", token.trim())
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Invalid or expired attendance token" },
        { status: 404 }
      );
    }

    // Already acknowledged
    if (existing.acknowledged_at !== null) {
      return NextResponse.json({
        success: true,
        already_acknowledged: true,
      });
    }

    // Perform the acknowledgment
    const { error: updateError } = await supabase
      .from("attendance_tokens")
      .update({
        acknowledged_at: new Date().toISOString(),
        shift_cleared: true,
      })
      .eq("token", token.trim())
      .is("acknowledged_at", null); // Safety: only update if still null

    if (updateError) {
      console.error("Acknowledge update error:", updateError);
      return NextResponse.json(
        { error: "Failed to record acknowledgment: " + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      already_acknowledged: false,
    });
  } catch (err) {
    console.error("Acknowledge error:", err);
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
