import { useState, type FormEvent } from "react";

import { LanguageToggle } from "../components/LanguageToggle";
import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { useI18n } from "../i18n/LocaleProvider";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { useHousehold } from "./HouseholdProvider";

export function SettingsPage() {
  const { t } = useI18n();
  const { household, currentRole, reload } = useHousehold();
  const [name, setName] = useState(household?.name ?? "");
  const [currency, setCurrency] = useState(household?.currency ?? "EUR");
  const [timezone, setTimezone] = useState(household?.timezone ?? "Europe/Berlin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!household) return null;

  const householdId = household.id;
  const inviteCode = household.inviteCode;
  const canEdit = currentRole === "owner" || currentRole === "admin";

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase
      .from("households")
      .update({
        name: name.trim(),
        currency: currency.trim().toUpperCase() || "EUR",
        timezone: timezone.trim() || "Europe/Berlin",
      })
      .eq("id", householdId);

    if (updateError) {
      setError(reportError(updateError, t("settings.errorSave")));
      setBusy(false);
      return;
    }

    await reload();
    setMessage(t("settings.saved"));
    setBusy(false);
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">{t("settings.title")}</h1>
        </div>
      </header>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <form className="card grid" onSubmit={(event) => void save(event)}>
        <label className="field">
          <span>{t("settings.language")}</span>
          <LanguageToggle />
        </label>
        <label className="field">
          <span>{t("settings.householdName")}</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} disabled={!canEdit} />
        </label>
        <label className="field">
          <span>{t("settings.currency")}</span>
          <input required value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={!canEdit} />
        </label>
        <label className="field">
          <span>{t("settings.timezone")}</span>
          <input required value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={!canEdit} />
        </label>
        {canEdit ? (
          <button className="primary" type="submit" disabled={busy}>
            {t("common.save")}
          </button>
        ) : (
          <p className="empty">{t("settings.readOnly")}</p>
        )}
      </form>

      <p className="sub">{t("settings.invite", { code: inviteCode })}</p>
    </section>
  );
}
