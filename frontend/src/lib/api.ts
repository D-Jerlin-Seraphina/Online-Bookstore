const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface ApiRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}) => {
  const { method = 'GET', body, token } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type');
  const hasBody = contentType && contentType.includes('application/json');
  const payload = hasBody ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || 'Request failed';
    throw new Error(message);
  }

  return payload as T;
};

export { API_BASE_URL };
