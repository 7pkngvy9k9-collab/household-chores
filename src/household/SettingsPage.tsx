import { useState, type FormEvent } from "react";

import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { useHousehold } from "./HouseholdProvider";

export function SettingsPage() {
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
      setError(reportError(updateError, "Household settings could not be saved. Please try again."));
      setBusy(false);
      return;
    }

    await reload();
    setMessage("Settings saved.");
    setBusy(false);
  }

  return (
    <section>
      <header className="page-head">
        <h1 className="brand">Settings</h1>
      </header>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      <form className="card grid" onSubmit={(event) => void save(event)}>
        <label className="field">
          <span>Household name</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} disabled={!canEdit} />
        </label>
        <label className="field">
          <span>Currency</span>
          <input required value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={!canEdit} />
        </label>
        <label className="field">
          <span>Time zone</span>
          <input required value={timezone} onChange={(event) => setTimezone(event.target.value)} disabled={!canEdit} />
        </label>
        {canEdit ? (
          <button className="primary" type="submit" disabled={busy}>
            Save
          </button>
        ) : (
          <p className="empty">Only owners and admins can change household settings.</p>
        )}
      </form>

      <p className="sub">
        Invite code: <strong>{inviteCode}</strong>
      </p>
    </section>
  );
}
