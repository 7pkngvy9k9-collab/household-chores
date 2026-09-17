import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useHouseholdChores } from "./ChoresProvider";
import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { fetchCompletions, type TaskCompletion } from "./api";
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
  const { household, members, currentMemberId } = useHousehold();
  const { chores, loading, error, add, complete, reopen, remove } = useHouseholdChores();

  const [mineOnly, setMineOnly] = useState(false);
  const [remindersOn, setRemindersOn] = useState(() => notificationsEnabled());
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
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
    const ids = chores.map((chore) => chore.id);
    if (ids.length === 0) {
      setCompletions([]);
      return;
    }
    let active = true;
    void fetchCompletions(ids)
      .then((rows) => {
        if (active) setCompletions(rows);
      })
      .catch(() => {
        if (active) setCompletions([]);
      });
    return () => {
      active = false;
    };
  }, [chores]);

  useEffect(() => {
    if (loading || pinged.current || !remindersOn) return;
    pinged.current = true;
    notifyWaiting(currentMemberName, waitingCount);
  }, [loading, remindersOn, currentMemberName, waitingCount]);

  async function enableReminders() {
    setRemindersOn(await requestNotifications());
  }

  if (!household) return null;

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Tasks</h1>
          <p className="sub">Signed in as {currentMemberName}</p>
        </div>
      </header>

      <ErrorMessage message={error} />

      <div className={`banner${waitingCount ? "" : " ok"}`}>
        <span>
          {waitingCount
            ? `${waitingCount} task${waitingCount === 1 ? "" : "s"} waiting for you.`
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
        <p className="empty">Loading tasks…</p>
      ) : chores.length === 0 ? (
        <p className="empty">
          No tasks yet. Add the first one your household needs to keep on top of.
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
            empty="No open on-demand tasks."
            handlers={handlers}
          />
          <ChoreSection
            title="Upcoming"
            chores={groups.upcoming}
            empty="No upcoming tasks."
            handlers={handlers}
          />
          {groups.done.length > 0 ? (
            <ChoreSection title="Done" chores={groups.done} empty="" handlers={handlers} />
          ) : null}
          {completions.length > 0 ? (
            <>
              <h2 className="section-title">Recent completions</h2>
              <ul className="dash-list card">
                {completions.map((row) => {
                  const task = chores.find((chore) => chore.id === row.taskId);
                  const who =
                    members.find((member) => member.userId === row.userId)?.name ?? "Someone";
                  return (
                    <li key={row.id}>
                      <strong>{task?.title ?? "Task"}</strong>
                      <span className="sub">
                        {who} · {new Date(row.completedAt).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </>
      )}

      <ChoreComposer members={members} onAdd={(chore) => void add(chore)} />
    </section>
  );
}
