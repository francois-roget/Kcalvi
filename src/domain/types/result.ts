export type DomainError = {
  code: string;
  /** Technical fallback message (logs, tests) — never display directly to the user, translate via `code` instead. */
  message: string;
  min?: number;
  max?: number;
};

export type Result<T, E = DomainError> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = DomainError>(error: E): Result<never, E> {
  return { ok: false, error };
}
