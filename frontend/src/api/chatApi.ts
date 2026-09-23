import { ApiRequestError, apiErrorFromResponse, isRecord } from './apiError';
import type { ChatMessage, ChatResponse } from '../types/chat';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = (configuredBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');

export async function sendChatMessage(
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<ChatResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiRequestError('Could not connect to the backend.', 0, 'NETWORK_ERROR');
  }

  const body = await response.text();
  let payload: unknown = null;
  if (body) {
    try {
      payload = JSON.parse(body) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw apiErrorFromResponse(response.status, payload);
  }

  if (!isRecord(payload) || typeof payload.message !== 'string') {
    throw new ApiRequestError('The backend returned an invalid chat response.', 502, 'INVALID_RESPONSE');
  }

  return { message: payload.message };
}
