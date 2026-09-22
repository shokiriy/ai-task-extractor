export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ExtractedTask {
  title: string;
  description: string | null;
  priority: TaskPriority | null;
  assignee: string | null;
  deadline: string | null;
  category: string | null;
}

export interface TaskAnalysisResponse {
  id: number;
  originalText: string;
  task: ExtractedTask;
  createdAt: string;
}

export interface PagedTaskAnalysisResponse {
  content: TaskAnalysisResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface BackendApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}
