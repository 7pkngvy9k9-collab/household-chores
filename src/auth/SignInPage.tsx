import { useRef, useState, type FormEvent } from "react";

import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { ThemeToggle } from "../components/ThemeToggle";
import { siteUrl } from "../lib/config";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";

export function SignInPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function authenticate(mode: "signin" | "signup") {
    setBusy(true);
    setError("");
    setMessage("");

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: siteUrl },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      // Supabase auth messages are already written for end users.
      setError(reportError(result.error, result.error.message));
      setBusy(false);
      return;
    }

    if (!result.data.session) {
      setMessage("Account created. Confirm it from the email we sent, then sign in.");
      setBusy(false);
      return;
    }

    // A session exists now, so AuthProvider swaps this page out. Leaving `busy`
    // set keeps the buttons inert during the handover.
    setPassword("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void authenticate("signin");
  }

  function handleSignUp() {
    if (formRef.current?.reportValidity()) void authenticate("signup");
  }

  return (
    <section className="setup">
      <div className="auth-mark" aria-hidden="true">
        H
      </div>
      <h1>Household</h1>
      <p className="sub">Shared chores, shopping, pinboard, finances</p>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <form ref={formRef} className="grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? "Working…" : "Sign in"}
        </button>
        <button className="linkish" type="button" disabled={busy} onClick={handleSignUp}>
          Create household or join with invite code
        </button>
      </form>

      <div className="theme-slot">
        <ThemeToggle />
      </div>
    </section>
  );
}
