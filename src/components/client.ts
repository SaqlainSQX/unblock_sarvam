'use client';
export class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function api<T>(path: string, payload?: unknown, method = 'POST'): Promise<T> {
  const response = await fetch(`/api/${path}`, payload === undefined ? { cache: 'no-store' } : {
    method, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new RequestError(data.error || 'Something went wrong. Please try again.', response.status);
  return data as T;
}
export const message = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';
