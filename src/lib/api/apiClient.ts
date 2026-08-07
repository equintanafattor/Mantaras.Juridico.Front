const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiErrorItem = {
  code: string;
  message: string;
};

type ApiErrorResponse = {
  errors?: ApiErrorItem[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: ApiErrorItem[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("No se configuró NEXT_PUBLIC_API_URL.");
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorResponse: ApiErrorResponse | undefined;

    try {
      errorResponse = (await response.json()) as ApiErrorResponse;
    } catch {
      errorResponse = undefined;
    }

    const errors = errorResponse?.errors ?? [];
    const message =
      errors.map((error) => error.message).join(" ") ||
      `La solicitud falló con estado ${response.status}.`;

    throw new ApiError(message, response.status, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
