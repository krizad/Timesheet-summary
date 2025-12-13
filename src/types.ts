export interface TimesheetRow {
  Date: string;
  'Hours Worked': string;
  'Project Name': string;
  Task: string;
  'Task Detail': string;
  Status: string;
}

export interface TaskSummary {
  taskName: string;
  manhours: number;
  mandays: number;
}

export interface ProjectSummary {
  projectName: string;
  tasks: TaskSummary[];
  totalManhours: number;
  totalMandays: number;
  startDate: string;
  endDate: string;
  dateRanges: { start: string; end: string; mandays: number }[];
}

export interface TimesheetSummary {
  projects: ProjectSummary[];
  totalWorkingDays: number;
  rawRows?: TimesheetRow[];
}
