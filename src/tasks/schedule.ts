import type { Translate } from "../i18n/LocaleProvider";
import type { Chore } from "./types";

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  // Midday keeps daylight-saving transitions from shifting the result by a day.
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function currentHolder(chore: Chore): string | null {
  if (chore.holderIds.length === 0) return null;
  return chore.holderIds[chore.holderIndex % chore.holderIds.length] ?? null;
}

/** A chore with no holders is open to anyone. */
export function isAssignedTo(chore: Chore, memberId: string | null): boolean {
  const holder = currentHolder(chore);
  return holder === null || holder === memberId;
}

export function isDue(chore: Chore, today: string = todayISO()): boolean {
  if (chore.kind === "on_demand" || chore.done) return false;
  return chore.dueDate !== null && chore.dueDate <= today;
}

export function isUpcoming(chore: Chore, today: string = todayISO()): boolean {
  if (chore.kind === "on_demand" || chore.done) return false;
  return chore.dueDate !== null && chore.dueDate > today;
}

export function isOverdue(chore: Chore, today: string = todayISO()): boolean {
  if (chore.kind === "on_demand" || chore.done) return false;
  return chore.dueDate !== null && chore.dueDate < today;
}

export function isWaitingFor(
  chore: Chore,
  memberId: string | null,
  today: string = todayISO(),
): boolean {
  if (chore.done || !isAssignedTo(chore, memberId)) return false;
  if (chore.kind === "on_demand") return true;
  return isDue(chore, today);
}

export function scheduleLabel(chore: Chore, t: Translate): string {
  if (chore.kind === "on_demand") return t("tasks.onDemand");
  if (chore.kind === "repeating") {
    const cadence =
      chore.repeat === "daily"
        ? chore.repeatInterval === 1
          ? t("tasks.daily")
          : t("tasks.everyDays", { count: chore.repeatInterval })
        : chore.repeat === "monthly"
          ? chore.repeatInterval === 1
            ? t("tasks.monthly")
            : t("tasks.everyMonths", { count: chore.repeatInterval })
          : chore.repeatInterval === 1
            ? t("tasks.weekly")
            : t("tasks.everyWeeks", { count: chore.repeatInterval });
    return t("tasks.next", { cadence, date: chore.dueDate ?? "—" });
  }
  return t("tasks.onDate", { date: chore.dueDate ?? "—" });
}

/**
 * A repeating chore rolls forward to its next date and, when rotation is on,
 * hands over to the next holder. Anything else is simply marked done.
 */
export function completedChore(
  chore: Chore,
  memberId: string | null,
  today: string = todayISO(),
): Chore {
  const completedAt = new Date().toISOString();

  if (chore.kind !== "repeating") {
    return { ...chore, done: true, lastDoneAt: completedAt, lastDoneBy: memberId };
  }

  return {
    ...chore,
    done: false,
    holderIndex: chore.rotate ? chore.holderIndex + 1 : chore.holderIndex,
    dueDate: addDays(
      today,
      chore.repeat === "daily"
        ? chore.repeatInterval
        : chore.repeat === "weekly"
          ? chore.repeatInterval * 7
          : 30 * chore.repeatInterval,
    ),
    lastDoneAt: completedAt,
    lastDoneBy: memberId,
  };
}
