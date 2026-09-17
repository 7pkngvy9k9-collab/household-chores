import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { useI18n } from "../i18n/LocaleProvider";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { MEMBER_ROLES, useHousehold, type MemberRole } from "./HouseholdProvider";

export function MembersPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { household, members, currentMemberId, currentRole, reload } = useHousehold();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!household) return null;

  const householdId = household.id;
  const inviteCode = household.inviteCode;
  const canManage = currentRole === "owner" || currentRole === "admin";
  const canChangeRoles = currentRole === "owner";

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const { error: rpcError } = await supabase.rpc("add_household_member", {
      p_household_id: householdId,
      p_name: name.trim(),
    });
    if (rpcError) {
      setError(reportError(rpcError, t("members.errorAdd")));
      setBusy(false);
      return;
    }
    setName("");
    setMessage(t("members.added"));
    await reload();
    setBusy(false);
  }

  async function changeRole(memberId: string, role: MemberRole) {
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("change_member_role", {
      p_member_id: memberId,
      p_role: role,
    });
    if (rpcError) {
      setError(reportError(rpcError, t("members.errorRole")));
    } else {
      await reload();
    }
    setBusy(false);
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!window.confirm(t("members.removeConfirm", { name: memberName }))) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("remove_household_member", {
      p_member_id: memberId,
    });
    if (rpcError) {
      setError(reportError(rpcError, t("members.errorRemove")));
    } else {
      await reload();
    }
    setBusy(false);
  }

  async function leaveHousehold() {
    if (!window.confirm(t("members.leaveConfirm"))) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("leave_household");
    if (rpcError) {
      setError(reportError(rpcError, t("members.errorLeave")));
      setBusy(false);
      return;
    }
    await reload();
    navigate("/setup", { replace: true });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage(t("members.copied"));
    } catch (cause) {
      setError(reportError(cause, t("members.errorCopy")));
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">{t("members.title")}</h1>
          <p className="sub">{t("members.inviteCode", { code: inviteCode })}</p>
        </div>
      </header>

      <button className="ghost stretch" type="button" onClick={() => void copyInvite()}>
        {t("members.copy")}
      </button>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {members.length === 0 ? (
        <p className="empty">{t("members.empty")}</p>
      ) : (
        members.map((member) => (
          <article className="card member-card" key={member.id}>
            <div className="member-identity">
              <span className="who-mark" aria-hidden="true">
                {member.name.trim().slice(0, 1).toUpperCase() || "?"}
              </span>
              <div>
                <h3>{member.name}</h3>
                <p className="sub">
                  {member.userId ? t("members.joined") : t("members.unclaimed")}
                  {member.id === currentMemberId ? t("members.youSuffix") : ""}
                </p>
              </div>
            </div>
            <div className="member-actions">
              {canChangeRoles && member.id !== currentMemberId ? (
                <div className="role-chips" role="group" aria-label={t("members.role")}>
                  {MEMBER_ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`chip${member.role === role ? " active" : ""}`}
                      disabled={busy}
                      onClick={() => {
                        if (role !== member.role) void changeRole(member.id, role);
                      }}
                    >
                      {t(`members.roles.${role}`)}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="chip active">{t(`members.roles.${member.role}`)}</span>
              )}
              {canManage && member.id !== currentMemberId ? (
                <button
                  className="danger"
                  type="button"
                  disabled={busy}
                  onClick={() => void removeMember(member.id, member.name)}
                >
                  {t("common.remove")}
                </button>
              ) : null}
            </div>
          </article>
        ))
      )}

      <form className="card grid" onSubmit={(event) => void addMember(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("members.addPerson")}
        </h2>
        <label className="field">
          <span>{t("common.name")}</span>
          <input
            required
            placeholder="Lisa"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          {t("members.addSeat")}
        </button>
      </form>

      <form
        className="card grid"
        onSubmit={(event) => {
          event.preventDefault();
          void (async () => {
            setBusy(true);
            setError("");
            const { data, error: inviteError } = await supabase.rpc("create_household_invitation", {
              p_household_id: householdId,
              p_days: 7,
            });
            if (inviteError) {
              setError(reportError(inviteError, t("members.errorInvite")));
            } else {
              setMessage(t("members.timedResult", { code: String(data) }));
            }
            setBusy(false);
          })();
        }}
      >
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("members.timed")}
        </h2>
        <p className="sub">{t("members.timedSub")}</p>
        <button className="ghost" type="submit" disabled={busy}>
          {t("members.createCode")}
        </button>
      </form>

      <button className="ghost stretch" type="button" disabled={busy} onClick={() => void leaveHousehold()}>
        {t("members.leave")}
      </button>
    </section>
  );
}
