import type { ReactNode } from "react";

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="error" role="alert">
      {message}
    </p>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  if (!message) return null;
  return <p className="ok-msg">{message}</p>;
}

export function RenderErrorBoundary({ children }: { children: ReactNode }) {
  return children;
}
