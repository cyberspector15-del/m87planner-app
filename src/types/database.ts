// Database types for the M87 Planner
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority: number;
  duration_minutes: number;
  deadline: string | null;
  flexible: boolean;
  location: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskInsert {
  title: string;
  description?: string | null;
  priority?: number;
  duration_minutes?: number;
  deadline?: string | null;
  flexible?: boolean;
  location?: string | null;
  completed?: boolean;
  user_id: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  priority?: number;
  duration_minutes?: number;
  deadline?: string | null;
  flexible?: boolean;
  location?: string | null;
  completed?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  commute_tolerance_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  travel_buffer_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'weekdays' | 'weekends';
  window_start: string;
  window_end: string;
  target_duration_minutes: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  event_id: string | null;
  task_id: string | null;
  outcome: 'done' | 'postponed' | 'skipped';
  notes: string | null;
  logged_at: string;
}
