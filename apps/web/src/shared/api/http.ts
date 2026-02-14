export type ApiError = Error & {
  status?: number;
  detail?: string;
};

export async function parseApiError(response: Response): Promise<ApiError> {
  let detail = `HTTP ${response.status}`;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body?.detail) {
      detail = body.detail;
    }
  } catch {
    // ignored
  }

  const error = new Error(detail) as ApiError;
  error.status = response.status;
  error.detail = detail;
  return error;
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as T;
}

export async function apiPut<T>(path: string, token: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as T;
}
