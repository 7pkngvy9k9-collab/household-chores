/**
 * Logs the technical cause for debugging and returns a message meant for the
 * user. Callers supply the wording so the UI never surfaces raw Postgres or
 * network errors.
 */
export function reportError(cause: unknown, userMessage: string): string {
  console.error(userMessage, cause);
  return userMessage;
}
