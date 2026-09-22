import { ApiRequestError, apiErrorFromResponse, isRecord } from './apiError';
import type {
  ExtractedTask,
  PagedTaskAnalysisResponse,
  TaskAnalysisResponse,
  TaskPriority,
} from '../types/taskAnalysis';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
const TASK_ANALYSES_URL = `${API_BASE_URL}/api/v1/task-analyses`;

async function readJson(response: Response): Promise<unknown> {
  const body = await response.text();
  if (!body) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(body);
    return parsed;
  } catch {
    return null;
  }
}

async function request(
  url: string,
  options: RequestInit,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, { ...options, signal });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiRequestError('Could not connect to the backend.', 0, 'NETWORK_ERROR');
  }

  const payload = await readJson(response);
  if (!response.ok) {
    throw apiErrorFromResponse(response.status, payload);
  }

  return payload;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isPriority(value: unknown): value is TaskPriority | null {
  return (
    value === null ||
    value === 'LOW' ||
    value === 'MEDIUM' ||
    value === 'HIGH' ||
    value === 'CRITICAL'
  );
}

function parseExtractedTask(value: unknown): ExtractedTask {
  if (!isRecord(value)) {
    throw invalidResponse();
  }

  const { title, description, priority, assignee, deadline, category } = value;
  if (
    typeof title !== 'string' ||
    !isNullableString(description) ||
    !isPriority(priority) ||
    !isNullableString(assignee) ||
    !isNullableString(deadline) ||
    !isNullableString(category)
  ) {
    throw invalidResponse();
  }

  return { title, description, priority, assignee, deadline, category };
}

function parseTaskAnalysis(value: unknown): TaskAnalysisResponse {
  if (!isRecord(value)) {
    throw invalidResponse();
  }

  const { id, originalText, task, createdAt } = value;
  if (
    typeof id !== 'number' ||
    typeof originalText !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    throw invalidResponse();
  }

  return {
    id,
    originalText,
    task: parseExtractedTask(task),
    createdAt,
  };
}

function parsePage(value: unknown): PagedTaskAnalysisResponse {
  if (!isRecord(value)) {
    throw invalidResponse();
  }

  const { content, page, size, totalElements, totalPages, last } = value;
  if (
    !Array.isArray(content) ||
    typeof page !== 'number' ||
    typeof size !== 'number' ||
    typeof totalElements !== 'number' ||
    typeof totalPages !== 'number' ||
    typeof last !== 'boolean'
  ) {
    throw invalidResponse();
  }

  return {
    content: content.map(parseTaskAnalysis),
    page,
    size,
    totalElements,
    totalPages,
    last,
  };
}

function invalidResponse(): ApiRequestError {
  return new ApiRequestError(
    'The backend returned an unexpected response shape.',
    502,
    'INVALID_RESPONSE',
  );
}

export async function analyzeTask(
  text: string,
  signal?: AbortSignal,
): Promise<TaskAnalysisResponse> {
  const payload = await request(
    TASK_ANALYSES_URL,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    },
    signal,
  );

  return parseTaskAnalysis(payload);
}

export async function getTaskAnalyses(
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<PagedTaskAnalysisResponse> {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  const payload = await request(
    `${TASK_ANALYSES_URL}?${query.toString()}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    signal,
  );

  return parsePage(payload);
}

export async function getTaskAnalysis(
  id: number,
  signal?: AbortSignal,
): Promise<TaskAnalysisResponse> {
  const payload = await request(
    `${TASK_ANALYSES_URL}/${id}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    signal,
  );

  return parseTaskAnalysis(payload);
}
