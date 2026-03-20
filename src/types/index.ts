export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  created_by: string;
  created_at: string;
}

export interface Worker {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  employee_id: string | null;
  created_at: string;
}

export interface AttendanceToken {
  id: string;
  meeting_id: string;
  worker_id: string;
  token: string;
  acknowledged_at: string | null;
  shift_cleared: boolean;
  created_at: string;
}

// Joined types for UI consumption
export interface AttendanceTokenWithWorker extends AttendanceToken {
  workers: Worker;
}

export interface AttendanceTokenWithMeeting extends AttendanceToken {
  meetings: Meeting;
}

export interface AttendanceTokenWithWorkerAndMeeting extends AttendanceToken {
  workers: Worker;
  meetings: Meeting;
}

export interface MeetingWithTokens extends Meeting {
  attendance_tokens: AttendanceToken[];
}

export interface MeetingWithTokenCount extends Meeting {
  total_tokens: number;
  acknowledged_tokens: number;
}

// API request/response types
export interface CreateMeetingRequest {
  title: string;
  description: string;
  scheduled_at: string;
  created_by: string;
  company_id: string;
  worker_ids: string[];
}

export interface CreateMeetingResponse {
  meeting_id: string;
  tokens: {
    worker_id: string;
    token: string;
    worker_name: string;
  }[];
}

export interface AcknowledgeRequest {
  token: string;
}

export interface AcknowledgeResponse {
  success: boolean;
  already_acknowledged: boolean;
}
