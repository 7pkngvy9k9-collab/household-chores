import { useRef, useState, type FormEvent } from "react";

import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useI18n } from "../i18n/LocaleProvider";
import { siteUrl } from "../lib/config";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";

export function SignInPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { t } = useI18n();
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
      setMessage(t("auth.created"));
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
      <h1>{t("auth.brand")}</h1>
      <p className="sub">{t("auth.sub")}</p>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <form ref={formRef} className="grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t("common.email")}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("common.email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="field">
          <span>{t("common.password")}</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            placeholder={t("common.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {busy ? t("common.working") : t("auth.signIn")}
        </button>
        <button className="linkish" type="button" disabled={busy} onClick={handleSignUp}>
          {t("auth.createJoin")}
        </button>
      </form>

      <div className="theme-slot">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </section>
  );
}
