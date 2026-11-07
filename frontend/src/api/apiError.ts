import { AxiosError } from 'axios';

/** Error body returned by the API's global exception filter. */
interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  details?: unknown;
}

/** A typed error thrown by every API call. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Human-readable message, including validation details when present. */
  get displayMessage(): string {
    if (this.code === 'VALIDATION_FAILED' && Array.isArray(this.details)) {
      return this.details.join(' • ');
    }
    return this.message;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const body = error.response?.data as Partial<ApiErrorBody> | undefined;
    if (body?.code) {
      return new ApiError(body.message ?? 'Request failed', body.status ?? error.response?.status ?? 500, body.code, body.details);
    }
    if (!error.response) {
      return new ApiError('Cannot reach the server. Please check your connection.', 0, 'NETWORK_ERROR');
    }
    return new ApiError(error.message, error.response.status, 'HTTP_ERROR');
  }
  return new ApiError(error instanceof Error ? error.message : 'Unexpected error', 500, 'UNKNOWN');
}

export function errorMessage(error: unknown): string {
  return toApiError(error).displayMessage;
}
