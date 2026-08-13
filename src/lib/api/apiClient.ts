import {
  notificarSesionNoAutorizada,
  obtenerAccessToken,
} from "@/features/autenticacion/lib/authSession";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiErrorItem = {
  code: string;
  message: string;
};

type ValidationProblemErrors = Record<string, string[]>;

type ApiErrorResponse = {
  title?: string;
  errors?: ApiErrorItem[] | ValidationProblemErrors;
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

  const accessToken = obtenerAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      notificarSesionNoAutorizada();
    }
    
    let errorResponse: ApiErrorResponse | undefined;

    try {
      errorResponse = (await response.json()) as ApiErrorResponse;
    } catch {
      errorResponse = undefined;
    }

    const rawErrors = errorResponse?.errors;

    let errors: ApiErrorItem[] = [];

    if (Array.isArray(rawErrors)) {
      errors = rawErrors;
    } else if (rawErrors && typeof rawErrors === "object") {
      errors = Object.entries(rawErrors).flatMap(([field, messages]) =>
        messages.map((message) => ({
          code: field,
          message,
        })),
      );
    }

    const message =
      errors.map((error) => error.message).join(" ") ||
      errorResponse?.title ||
      `La solicitud falló con estado ${response.status}.`;

    throw new ApiError(message, response.status, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
