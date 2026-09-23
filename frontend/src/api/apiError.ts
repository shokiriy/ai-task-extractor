import type { BackendApiError } from '../types/taskAnalysis';

export interface UiError {
  title: string;
  message: string;
}

export type ApiOperation = 'analysis' | 'history' | 'detail' | 'chat';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBackendApiError(value: unknown): BackendApiError | null {
  if (!isRecord(value)) {
    return null;
  }

  const { timestamp, status, error, message, path } = value;
  if (
    typeof timestamp !== 'string' ||
    typeof status !== 'number' ||
    typeof error !== 'string' ||
    typeof message !== 'string' ||
    typeof path !== 'string'
  ) {
    return null;
  }

  return { timestamp, status, error, message, path };
}

export function apiErrorFromResponse(status: number, payload: unknown): ApiRequestError {
  const backendError = parseBackendApiError(payload);

  return new ApiRequestError(
    backendError?.message ?? `The server returned HTTP ${status}.`,
    status,
    backendError?.error ?? 'HTTP_ERROR',
  );
}

export function normalizeApiError(error: unknown, operation: ApiOperation): UiError {
  if (error instanceof ApiRequestError) {
    if (error.code === 'NETWORK_ERROR') {
      return {
        title: 'Could not connect to the backend',
        message: 'Make sure Spring Boot is running on the configured API URL.',
      };
    }

    if (error.code === 'AI_PROVIDER_ERROR' || error.code === 'MALFORMED_AI_RESPONSE') {
      return {
        title: 'Local AI could not answer',
        message: `${error.message} Make sure Ollama is running and the configured model is installed.`,
      };
    }

    if (error.code === 'VALIDATION_ERROR') {
      return {
        title: operation === 'chat' ? 'Check the message' : 'Check the task text',
        message: error.message,
      };
    }

    if (error.status === 404) {
      return {
        title: 'Analysis not found',
        message: error.message,
      };
    }

    if (error.status >= 500) {
      return {
        title: 'Server error',
        message: error.message,
      };
    }

    return {
      title: 'Request failed',
      message: error.message,
    };
  }

  const fallbackByOperation: Record<ApiOperation, UiError> = {
    analysis: {
      title: 'Could not analyze the task',
      message: 'An unexpected error occurred while analyzing the task.',
    },
    history: {
      title: 'Could not load recent analyses',
      message: 'Try refreshing the history in a moment.',
    },
    detail: {
      title: 'Could not load analysis details',
      message: 'Select the analysis again or try another record.',
    },
    chat: {
      title: 'Could not send the message',
      message: 'An unexpected error occurred while contacting the local AI model.',
    },
  };

  return fallbackByOperation[operation];
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
