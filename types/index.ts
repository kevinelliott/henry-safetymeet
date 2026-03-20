export interface Meeting {
  id: string;
  user_id: string;
  title: string;
  topic_category: string;
  description: string | null;
  meeting_date: string;
  site_name: string | null;
  token: string;
  status: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  meeting_id: string;
  worker_name: string;
  worker_signature: string | null;
  worker_ip: string | null;
  acknowledged_at: string;
  understood: boolean;
}
