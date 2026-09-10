const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export const fetchClient = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for cookies
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new ApiError('An unexpected error occurred', 'UNKNOWN_ERROR');
    }
    return null;
  }

  if (!response.ok) {
    const errorBody = data.error || {};
    throw new ApiError(
      errorBody.message || 'An error occurred',
      errorBody.code || 'UNKNOWN_ERROR',
      errorBody.details
    );
  }

  return data;
};
