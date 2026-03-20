import { createClient } from "@supabase/supabase-js";

export function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function getSupabaseClient() {
  return createClient(getUrl(), getAnonKey());
}

export function getSupabaseServiceClient() {
  return createClient(getUrl(), getServiceKey());
}
