import { Component, type ErrorInfo, type ReactNode } from "react";

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

export class RenderErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.setState({ failed: true });
  }

  override render(): ReactNode {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
