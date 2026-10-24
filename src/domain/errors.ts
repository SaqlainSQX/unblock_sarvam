export class AppError extends Error {
  constructor(public status: number, message: string, public code = 'request_failed') { super(message); }
}
export function requireValue<T>(value: T | null | undefined, status = 404, message = 'This item was not found.'): T {
  if (value === undefined || value === null) throw new AppError(status, message);
  return value;
}
