import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppShell } from "../components/AppShell";
import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { ChoreCard } from "./ChoreCard";
import { ChoreComposer } from "./ChoreComposer";
import {
  notificationsEnabled,
  notifyWaiting,
  requestNotifications,
  supportsNotifications,
} from "./notifications";
import { isAssignedTo, isDue, isUpcoming, isWaitingFor, todayISO } from "./schedule";
import type { Chore } from "./types";
import { useChores } from "./useChores";

type CardHandlers = {
  currentMemberId: string | null;
  memberName: (id: string) => string;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  onRemove: (id: string) => void;
};

function ChoreSection({
  title,
  chores,
  empty,
  handlers,
}: {
  title: string;
  chores: Chore[];
  empty: string;
  handlers: CardHandlers;
}) {
  return (
    <>
      <h2 className="section-title">{title}</h2>
      {chores.length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        chores.map((chore) => <ChoreCard key={chore.id} chore={chore} {...handlers} />)
      )}
    </>
  );
}

export function ChoresPage() {
  const { household, members, currentMemberId, reload: reloadHousehold } = useHousehold();
  const { chores, loading, error, reload, add, complete, reopen, remove } = useChores(
    household?.id ?? null,
    currentMemberId,
  );

  const [mineOnly, setMineOnly] = useState(false);
  const [remindersOn, setRemindersOn] = useState(() => notificationsEnabled());
  const pinged = useRef(false);

  const memberName = useCallback(
    (id: string) => members.find((member) => member.id === id)?.name ?? "Anyone",
    [members],
  );

  const currentMemberName = currentMemberId ? memberName(currentMemberId) : "you";

  const groups = useMemo(() => {
    const today = todayISO();
    const visible = mineOnly
      ? chores.filter((chore) => isAssignedTo(chore, currentMemberId))
      : chores;

    return {
      due: visible.filter((chore) => isDue(chore, today)),
      onDemand: visible.filter((chore) => chore.kind === "on_demand" && !chore.done),
      upcoming: visible.filter((chore) => isUpcoming(chore, today)),
      // Completed one-off chores stay visible regardless of the filter.
      done: chores.filter((chore) => chore.done && chore.kind !== "repeating"),
      waiting: chores.filter((chore) => isWaitingFor(chore, currentMemberId, today)),
    };
  }, [chores, currentMemberId, mineOnly]);

  const handlers = useMemo<CardHandlers>(
    () => ({
      currentMemberId,
      memberName,
      onComplete: (id) => void complete(id),
      onReopen: (id) => void reopen(id),
      onRemove: (id) => void remove(id),
    }),
    [currentMemberId, memberName, complete, reopen, remove],
  );

  const waitingCount = groups.waiting.length;

  useEffect(() => {
    if (loading || pinged.current || !remindersOn) return;
    pinged.current = true;
    notifyWaiting(currentMemberName, waitingCount);
  }, [loading, remindersOn, currentMemberName, waitingCount]);

  const refresh = useCallback(() => {
    void reloadHousehold();
    void reload();
  }, [reloadHousehold, reload]);

  async function enableReminders() {
    setRemindersOn(await requestNotifications());
  }

  if (!household) return null;

  return (
    <AppShell
      title={household.name}
      subtitle={
        <>
          Invite code: <strong>{household.inviteCode}</strong> · signed in as {currentMemberName}
        </>
      }
      onRefresh={refresh}
    >
      <ErrorMessage message={error} />

      <div className={`banner${waitingCount ? "" : " ok"}`}>
        <span>
          {waitingCount
            ? `${waitingCount} chore${waitingCount === 1 ? "" : "s"} waiting for you.`
            : "Nothing waiting for you right now."}
        </span>
        {remindersOn ? (
          <span>Reminders on</span>
        ) : supportsNotifications() ? (
          <button className="ghost" type="button" onClick={() => void enableReminders()}>
            Enable reminders
          </button>
        ) : null}
      </div>

      <div className="filters">
        <button
          className={`chip${mineOnly ? "" : " active"}`}
          type="button"
          onClick={() => setMineOnly(false)}
        >
          Everyone
        </button>
        <button
          className={`chip${mineOnly ? " active" : ""}`}
          type="button"
          onClick={() => setMineOnly(true)}
        >
          My turn
        </button>
      </div>

      {loading ? (
        <p className="empty">Loading chores…</p>
      ) : chores.length === 0 ? (
        <p className="empty">
          No chores yet. Add the first one your household needs to keep on top of.
        </p>
      ) : (
        <>
          <ChoreSection
            title="Due now"
            chores={groups.due}
            empty="Nothing due."
            handlers={handlers}
          />
          <ChoreSection
            title="On demand"
            chores={groups.onDemand}
            empty="No open on-demand chores."
            handlers={handlers}
          />
          <ChoreSection
            title="Upcoming"
            chores={groups.upcoming}
            empty="No upcoming chores."
            handlers={handlers}
          />
          {groups.done.length > 0 ? (
            <ChoreSection title="Done" chores={groups.done} empty="" handlers={handlers} />
          ) : null}
        </>
      )}

      <ChoreComposer members={members} onAdd={(chore) => void add(chore)} />
    </AppShell>
  );
}
