export type ApiErrorCode =
  | 'HTTP_ERROR'
  | 'TIMEOUT_ERROR'
  | 'CANCELLED_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR';

export class ApiError extends Error {
  code: ApiErrorCode;
  status?: number;
  url: string;
  cause?: unknown;

  constructor({
    message,
    code,
    url,
    status,
    cause,
  }: {
    message: string;
    code: ApiErrorCode;
    url: string;
    status?: number;
    cause?: unknown;
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.url = url;
    this.cause = cause;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
