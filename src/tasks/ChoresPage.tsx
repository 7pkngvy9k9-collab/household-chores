import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useHouseholdChores } from "./ChoresProvider";
import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { useI18n } from "../i18n/LocaleProvider";
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
        <div className="checklist">
          {chores.map((chore) => (
            <ChoreCard key={chore.id} chore={chore} {...handlers} />
          ))}
        </div>
      )}
    </>
  );
}

export function ChoresPage() {
  const { household, members, currentMemberId } = useHousehold();
  const { t } = useI18n();
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
          <h1 className="brand">{t("tasks.title")}</h1>
        </div>
      </header>

      <ErrorMessage message={error} />

      <div className={`banner${waitingCount ? "" : " ok"}`}>
        <span>
          {waitingCount
            ? t(waitingCount === 1 ? "tasks.waitingOne" : "tasks.waitingMany", { count: waitingCount })
            : t("tasks.waitingNone")}
        </span>
        {remindersOn ? (
          <span>{t("tasks.remindersOn")}</span>
        ) : supportsNotifications() ? (
          <button className="ghost" type="button" onClick={() => void enableReminders()}>
            {t("tasks.enableReminders")}
          </button>
        ) : null}
      </div>

      <div className="filters">
        <button
          className={`chip${mineOnly ? "" : " active"}`}
          type="button"
          onClick={() => setMineOnly(false)}
        >
          {t("tasks.everyone")}
        </button>
        <button
          className={`chip${mineOnly ? " active" : ""}`}
          type="button"
          onClick={() => setMineOnly(true)}
        >
          {t("tasks.myTurn")}
        </button>
      </div>

      {loading ? (
        <p className="empty">{t("tasks.loading")}</p>
      ) : chores.length === 0 ? (
        <p className="empty">{t("tasks.empty")}</p>
      ) : (
        <>
          <ChoreSection
            title={t("tasks.dueNow")}
            chores={groups.due}
            empty={t("tasks.nothingDue")}
            handlers={handlers}
          />
          <ChoreSection
            title={t("tasks.onDemand")}
            chores={groups.onDemand}
            empty={t("tasks.noOnDemand")}
            handlers={handlers}
          />
          <ChoreSection
            title={t("tasks.upcoming")}
            chores={groups.upcoming}
            empty={t("tasks.noUpcoming")}
            handlers={handlers}
          />
          {groups.done.length > 0 ? (
            <ChoreSection title={t("tasks.completed")} chores={groups.done} empty="" handlers={handlers} />
          ) : null}
          {completions.length > 0 ? (
            <>
              <h2 className="section-title">{t("tasks.recent")}</h2>
              <ul className="dash-list card">
                {completions.map((row) => {
                  const task = chores.find((chore) => chore.id === row.taskId);
                  const who =
                    members.find((member) => member.userId === row.userId)?.name ?? t("common.someone");
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
