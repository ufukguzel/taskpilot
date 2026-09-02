export type TaskType = "command" | "http";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type RunStatus = "running" | "success" | "failed";

export interface TaskRun {
  id: number;
  task_id: number;
  status: RunStatus;
  trigger: "manual" | "scheduled";
  output: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface Task {
  id: number;
  name: string;
  description: string | null;
  task_type: TaskType;
  command: string | null;
  url: string | null;
  http_method: HttpMethod;
  schedule: string | null;
  enabled: boolean;
  notify_on_failure: boolean;
  created_at: string;
  updated_at: string;
  last_run: TaskRun | null;
}

export interface TaskInput {
  name: string;
  description?: string;
  task_type: TaskType;
  command?: string;
  url?: string;
  http_method?: HttpMethod;
  schedule?: string;
  enabled?: boolean;
  notify_on_failure?: boolean;
}

export interface Stats {
  total_tasks: number;
  enabled_tasks: number;
  scheduled_tasks: number;
  total_runs: number;
  failed_runs: number;
}

export type WsEvent =
  | {
      event: "run_started";
      task_id: number;
      run_id: number;
      task_name: string;
      trigger: "manual" | "scheduled";
      started_at: string;
    }
  | { event: "log"; task_id: number; run_id: number; line: string }
  | {
      event: "run_finished";
      task_id: number;
      run_id: number;
      status: RunStatus;
      finished_at: string;
    };

export interface LiveRun {
  runId: number;
  taskId: number;
  taskName: string;
  trigger: "manual" | "scheduled";
  status: RunStatus;
  lines: string[];
}
