import { useState, type FormEvent } from "react";

import { useAuth } from "../auth/AuthProvider";
import { ErrorMessage } from "../components/Feedback";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageToggle } from "../components/LanguageToggle";
import { useI18n } from "../i18n/LocaleProvider";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { useHousehold } from "./HouseholdProvider";

type Seat = {
  id: string;
  name: string;
  claimed: boolean;
};

export function OnboardingPage() {
  const { user, signOut } = useAuth();
  const { reload } = useHousehold();
  const { t } = useI18n();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [householdName, setHouseholdName] = useState("");
  const [memberNames, setMemberNames] = useState(["", ""]);

  const [joinCode, setJoinCode] = useState("");
  const [joinHouseholdName, setJoinHouseholdName] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState("");

  function setMemberName(index: number, value: string) {
    setMemberNames((current) =>
      current.map((name, position) => (position === index ? value : name)),
    );
  }

  async function createHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const names = memberNames.map((name) => name.trim()).filter(Boolean);

    setBusy(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("create_household", {
      p_name: householdName.trim(),
      p_member_names: names,
    });

    if (rpcError) {
      setError(reportError(rpcError, "The household could not be created. Please try again."));
      setBusy(false);
      return;
    }

    await reload();
    setBusy(false);
  }

  async function lookupHousehold(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = joinCode.trim();

    setBusy(true);
    setError("");
    setSeats([]);

    const [household, members] = await Promise.all([
      supabase.rpc("lookup_household_by_invite", { p_code: code }),
      supabase.rpc("list_members_by_invite", { p_code: code }),
    ]);

    const failure = household.error ?? members.error;
    if (failure) {
      setError(reportError(failure, "We could not look up that invite code. Please try again."));
      setBusy(false);
      return;
    }

    const found = household.data?.at(0);
    if (!found) {
      setError("No household found for that invite code.");
      setBusy(false);
      return;
    }

    const roster = members.data ?? [];
    setJoinHouseholdName(found.name);
    setSeats(roster);
    setSelectedSeat(roster.find((seat) => !seat.claimed)?.id ?? "");
    setBusy(false);
  }

  async function claimSeat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("join_household", {
      p_code: joinCode.trim(),
      p_member_id: selectedSeat,
    });

    if (rpcError) {
      setError(reportError(rpcError, "We could not add you to that household. Please try again."));
      setBusy(false);
      return;
    }

    await reload();
    setBusy(false);
  }

  return (
    <section className="setup">
      <h1>{t("setup.heading")}</h1>
      <p className="sub">{user?.email ?? ""}</p>

      <ErrorMessage message={error} />

      <form className="grid" onSubmit={createHousehold}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("setup.create")}
        </h2>
        <label className="field">
          <span>{t("setup.householdName")}</span>
          <input
            required
            placeholder={t("setup.householdPlaceholder")}
            value={householdName}
            onChange={(event) => setHouseholdName(event.target.value)}
          />
        </label>

        <div>
          <span className="sub">{t("setup.people")}</span>
          {memberNames.map((name, index) => (
            <div className="member-row" key={index}>
              <input
                required={index < 2}
                placeholder={index === 0 ? t("setup.yourName") : t("common.name")}
                value={name}
                onChange={(event) => setMemberName(index, event.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            className="ghost"
            onClick={() => setMemberNames((current) => [...current, ""])}
          >
            {t("setup.addPerson")}
          </button>
        </div>

        <button className="primary" type="submit" disabled={busy}>
          {t("setup.createHousehold")}
        </button>
      </form>

      <hr className="divider" />

      <form className="grid" onSubmit={lookupHousehold}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("setup.join")}
        </h2>
        <label className="field">
          <span>{t("setup.inviteCode")}</span>
          <input
            required
            placeholder="AB12CD34"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
          />
        </label>
        <button className="ghost" type="submit" disabled={busy}>
          {t("setup.lookup")}
        </button>
      </form>

      {seats.length > 0 ? (
        <form className="grid" onSubmit={claimSeat}>
          <p className="sub">
            {t("setup.joinAs", { name: joinHouseholdName ?? "" })}
          </p>
          <label className="field">
            <span>{t("setup.yourSeat")}</span>
            <select
              required
              value={selectedSeat}
              onChange={(event) => setSelectedSeat(event.target.value)}
            >
              {seats.map((seat) => (
                <option key={seat.id} value={seat.id} disabled={seat.claimed}>
                  {seat.name}
                  {seat.claimed ? ` ${t("setup.taken")}` : ""}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" type="submit" disabled={busy}>
            {t("setup.joinHousehold")}
          </button>
        </form>
      ) : null}

      <button className="ghost" type="button" onClick={() => void signOut()}>
        {t("common.signOut")}
      </button>
      <div className="theme-slot">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </section>
  );
}
