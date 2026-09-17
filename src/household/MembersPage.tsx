import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { MEMBER_ROLES, useHousehold, type MemberRole } from "./HouseholdProvider";

export function MembersPage() {
  const navigate = useNavigate();
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
      setError(reportError(rpcError, "The person could not be added. Please try again."));
      setBusy(false);
      return;
    }
    setName("");
    setMessage("Seat added. Share the invite code so they can join.");
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
      setError(reportError(rpcError, "The role could not be changed. Please try again."));
    } else {
      await reload();
    }
    setBusy(false);
  }

  async function removeMember(memberId: string, memberName: string) {
    if (!window.confirm(`Remove ${memberName} from the household?`)) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("remove_household_member", {
      p_member_id: memberId,
    });
    if (rpcError) {
      setError(reportError(rpcError, "The member could not be removed. Please try again."));
    } else {
      await reload();
    }
    setBusy(false);
  }

  async function leaveHousehold() {
    if (!window.confirm("Leave this household? You can rejoin later with the invite code.")) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("leave_household");
    if (rpcError) {
      setError(reportError(rpcError, "You could not leave the household. Please try again."));
      setBusy(false);
      return;
    }
    await reload();
    navigate("/setup", { replace: true });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setMessage("Invite code copied.");
    } catch (cause) {
      setError(reportError(cause, "The invite code could not be copied."));
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Members</h1>
          <p className="sub">
            Invite code: <strong>{inviteCode}</strong>
          </p>
        </div>
        <button className="ghost" type="button" onClick={() => void copyInvite()}>
          Copy invite code
        </button>
      </header>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {members.length === 0 ? (
        <p className="empty">No members yet.</p>
      ) : (
        members.map((member) => (
          <article className="card member-card" key={member.id}>
            <div>
              <h3>{member.name}</h3>
              <p className="sub">
                {member.userId ? "Joined" : "Unclaimed seat"}
                {member.id === currentMemberId ? " · you" : ""}
              </p>
            </div>
            <div className="member-actions">
              {canChangeRoles && member.id !== currentMemberId ? (
                <select
                  value={member.role}
                  disabled={busy}
                  onChange={(event) => void changeRole(member.id, event.target.value as MemberRole)}
                >
                  {MEMBER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="pill">{member.role}</span>
              )}
              {canManage && member.id !== currentMemberId ? (
                <button
                  className="danger"
                  type="button"
                  disabled={busy}
                  onClick={() => void removeMember(member.id, member.name)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </article>
        ))
      )}

      <form className="card grid" onSubmit={(event) => void addMember(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Add a person
        </h2>
        <label className="field">
          <span>Name</span>
          <input
            required
            placeholder="Lisa"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          Add seat
        </button>
      </form>

      <button className="ghost" type="button" disabled={busy} onClick={() => void leaveHousehold()}>
        Leave household
      </button>
    </section>
  );
}
