type SupabaseErrorLike = {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

export function logSupabaseError(context: string, error: unknown) {
  const info = getSupabaseErrorInfo(error);
  const message =
    typeof info.message === "string" && info.message.length > 0
      ? info.message
      : "Error desconocido de Supabase.";

  console.error(`[Supabase] ${context}: ${message}`, info);
}

function getSupabaseErrorInfo(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  if (!isObject(error)) {
    return {
      message: String(error),
    };
  }

  const errorLike = error as SupabaseErrorLike;
  const info = {
    code: getStringValue(errorLike.code),
    details: getStringValue(errorLike.details),
    hint: getStringValue(errorLike.hint),
    message: getStringValue(errorLike.message),
    name: getStringValue(errorLike.name),
    status: getStringValue(errorLike.status),
    statusCode: getStringValue(errorLike.statusCode),
  };

  return Object.fromEntries(
    Object.entries(info).filter(([, value]) => value !== undefined),
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringValue(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  return String(value);
}
