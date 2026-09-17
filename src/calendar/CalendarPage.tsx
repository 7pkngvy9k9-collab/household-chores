import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { CompleteToggle } from "../components/CompleteToggle";
import { useHousehold } from "../household/HouseholdProvider";
import { useI18n } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/util";
import { supabase } from "../lib/supabase";
import { useHouseholdChores } from "../tasks/ChoresProvider";
import { currentHolder, isAssignedTo, isOverdue, addDays, todayISO, toISODate } from "../tasks/schedule";
import type { Chore } from "../tasks/types";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

type CalEvent = { id: string; title: string; date: string };
type Absence = { id: string; memberId: string; start: string; end: string; reason: string | null };
type CalView = "week" | "month";

function mondayOf(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toISODate(date);
}

function addMonthsISO(iso: string, delta: number): string {
  const date = new Date(`${iso}T12:00:00`);
  const day = date.getDate();
  date.setMonth(date.getMonth() + delta);
  if (date.getDate() !== day) date.setDate(0);
  return toISODate(date);
}

function localeTag(locale: Locale): string {
  return locale === "de" ? "de-DE" : "en-GB";
}

function formatWeekRange(startIso: string, endIso: string, locale: Locale): string {
  const start = new Date(`${startIso}T12:00:00`);
  const end = new Date(`${endIso}T12:00:00`);
  const loc = localeTag(locale);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const endPart = end.toLocaleDateString(loc, {
    day: "numeric",
    month: locale === "de" ? "numeric" : "short",
    year: "numeric",
  });
  if (locale === "de") {
    if (sameMonth) return `${start.getDate()}.–${endPart}`;
    return `${start.toLocaleDateString(loc, { day: "numeric", month: "numeric" })}–${endPart}`;
  }
  if (sameMonth) return `${start.getDate()}–${endPart}`;
  return `${start.toLocaleDateString(loc, { day: "numeric", month: "short" })} – ${endPart}`;
}

function monthYearLabel(iso: string, locale: Locale): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(localeTag(locale), {
    month: "long",
    year: "numeric",
  });
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function CalendarPage() {
  const { household, members, currentMemberId } = useHousehold();
  const { chores, complete, reopen } = useHouseholdChores();
  const { t, locale } = useI18n();
  const today = todayISO();
  const [anchor, setAnchor] = useState(today);
  const [view, setView] = useState<CalView>("week");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(today);
  const [awayMember, setAwayMember] = useState(currentMemberId ?? "");
  const [awayStart, setAwayStart] = useState(today);
  const [awayEnd, setAwayEnd] = useState(today);
  const [awayReason, setAwayReason] = useState("");

  useEffect(() => {
    if (!household) return;
    let active = true;
    void (async () => {
      const [eventRows, absenceRows] = await Promise.all([
        supabase.from("household_events").select("*").eq("household_id", household.id),
        supabase.from("absences").select("*").eq("household_id", household.id),
      ]);
      if (!active) return;
      setEvents(
        (eventRows.data ?? []).map((row) => ({ id: row.id, title: row.title, date: row.event_date })),
      );
      setAbsences(
        (absenceRows.data ?? []).map((row) => ({
          id: row.id,
          memberId: row.member_id,
          start: row.start_date,
          end: row.end_date,
          reason: row.reason,
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, [household]);

  const weekStart = mondayOf(anchor);
  const weekEnd = addDays(weekStart, 6);
  const weekIsos = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart],
  );
  const thisWeek = today >= weekStart && today <= weekEnd;

  const monthCursor = useMemo(() => {
    const date = new Date(`${anchor}T12:00:00`);
    return { year: date.getFullYear(), month: date.getMonth() };
  }, [anchor]);

  const cells = useMemo(() => {
    const first = startOfMonth(monthCursor.year, monthCursor.month);
    const lead = mondayIndex(first);
    const daysInMonth = new Date(monthCursor.year, monthCursor.month + 1, 0).getDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const day = index - lead + 1;
      if (day < 1 || day > daysInMonth) return { iso: null as string | null, day: null as number | null };
      return { iso: toISODate(new Date(monthCursor.year, monthCursor.month, day)), day };
    });
  }, [monthCursor]);

  if (!household) return null;
  const householdId = household.id;

  async function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await supabase.from("household_events").insert({
      household_id: householdId,
      title: eventTitle.trim(),
      event_date: eventDate,
      created_by: currentMemberId,
    });
    setEventTitle("");
    const { data } = await supabase.from("household_events").select("*").eq("household_id", householdId);
    setEvents((data ?? []).map((row) => ({ id: row.id, title: row.title, date: row.event_date })));
  }

  async function addAbsence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await supabase.from("absences").insert({
      household_id: householdId,
      member_id: awayMember,
      start_date: awayStart,
      end_date: awayEnd,
      reason: awayReason.trim() || null,
    });
    const { data } = await supabase.from("absences").select("*").eq("household_id", householdId);
    setAbsences(
      (data ?? []).map((row) => ({
        id: row.id,
        memberId: row.member_id,
        start: row.start_date,
        end: row.end_date,
        reason: row.reason,
      })),
    );
  }

  const memberName = (id: string) => members.find((member) => member.id === id)?.name ?? t("common.someone");
  const choresOn = (iso: string) => chores.filter((chore) => chore.dueDate === iso);
  const eventsOn = (iso: string) => events.filter((item) => item.date === iso);
  const awayOn = (iso: string) => absences.filter((item) => item.start <= iso && item.end >= iso);

  function goPrev() {
    setAnchor((current) => (view === "week" ? addDays(mondayOf(current), -7) : addMonthsISO(current, -1)));
  }

  function goNext() {
    setAnchor((current) => (view === "week" ? addDays(mondayOf(current), 7) : addMonthsISO(current, 1)));
  }

  function awayLabel(item: Absence): string {
    const name = memberName(item.memberId);
    return item.reason
      ? t("calendar.awayChipReason", { name, reason: item.reason })
      : t("calendar.awayChip", { name });
  }

  function renderChoreRow(chore: Chore) {
    const holderId = currentHolder(chore);
    const holder = holderId ? memberName(holderId) : t("common.anyone");
    const mark = holderId ? holder.trim().slice(0, 1).toUpperCase() : undefined;
    const mine = isAssignedTo(chore, currentMemberId);
    const overdue = isOverdue(chore);
    return (
      <div className={`cal-chore${chore.done ? " is-done" : ""}${overdue ? " is-overdue" : ""}`} key={chore.id}>
        <CompleteToggle
          checked={chore.done}
          label={chore.done ? t("tasks.reopen", { title: chore.title }) : t("tasks.markDone", { title: chore.title })}
          onChange={(next) => (next ? void complete(chore.id) : void reopen(chore.id))}
        />
        <span className="cal-chore-copy">
          <span className="cal-chore-title">
            {chore.title}
            <span className="cal-chore-assignee"> · {holder}</span>
          </span>
          {overdue ? <span className="cal-chore-flag">{t("tasks.overdue")}</span> : null}
        </span>
        {mark ? (
          <span className={`who-mark${overdue ? " is-overdue" : ""}${mine && !chore.done ? " is-mine" : ""}`}>
            {mark}
          </span>
        ) : null}
      </div>
    );
  }

  function renderDayBits(iso: string) {
    const tasks = choresOn(iso);
    const dayEvents = eventsOn(iso);
    const dayAway = awayOn(iso);
    return (
      <>
        {tasks.length === 0 && dayEvents.length === 0 && dayAway.length === 0 ? (
          <p className="cal-empty">{t("calendar.emptyDay")}</p>
        ) : null}
        {tasks.map(renderChoreRow)}
        {dayEvents.length || dayAway.length ? (
          <div className="cal-chip-row">
            {dayEvents.map((item) => (
              <span className="cal-event" key={item.id}>
                {item.title}
              </span>
            ))}
            {dayAway.map((item) => (
              <span className="cal-event is-away" key={item.id}>
                {awayLabel(item)}
              </span>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">{t("calendar.title")}</h1>
          <p className="sub">{t("calendar.sub")}</p>
        </div>
      </header>

      <div className="cal-week-head">
        <div className="cal-week-tools">
          <button className="chip cal-jump" type="button" onClick={() => setAnchor(todayISO())}>
            {t("calendar.today")}
          </button>
        </div>
        <div className="cal-range">
          <button className="icon-btn cal-arrow" type="button" onClick={goPrev} aria-label={t("calendar.prev")}>
            ‹
          </button>
          <div className="cal-range-label">
            {view === "week" && thisWeek ? <p className="cal-range-kicker">{t("calendar.thisWeek")}</p> : null}
            <p className="cal-range-dates">
              {view === "week" ? formatWeekRange(weekStart, weekEnd, locale) : monthYearLabel(anchor, locale)}
            </p>
            {view === "week" ? <p className="sub">{monthYearLabel(weekStart, locale)}</p> : null}
          </div>
          <button className="icon-btn cal-arrow" type="button" onClick={goNext} aria-label={t("calendar.next")}>
            ›
          </button>
        </div>
      </div>

      <div className="cal-views filters" role="group" aria-label={t("calendar.viewLabel")}>
        <button className={`chip${view === "week" ? " active" : ""}`} type="button" onClick={() => setView("week")}>
          {t("calendar.viewWeek")}
        </button>
        <button className={`chip${view === "month" ? " active" : ""}`} type="button" onClick={() => setView("month")}>
          {t("calendar.viewMonth")}
        </button>
      </div>

      {view === "week" ? (
        <div className="cal-agenda">
          {weekIsos.map((iso, index) => {
            const dayNum = Number(iso.slice(8));
            const isToday = iso === today;
            return (
              <article className={`cal-day-card${isToday ? " is-today" : ""}`} key={iso}>
                <header className="cal-day-head">
                  <span>
                    {t(`calendar.weekdays.${WEEKDAY_KEYS[index]}`)} {dayNum}
                  </span>
                  {isToday ? <span className="cal-today-badge">{t("calendar.today")}</span> : null}
                </header>
                {renderDayBits(iso)}
              </article>
            );
          })}
        </div>
      ) : (
        <>
          <div className="cal-weekdays">
            {WEEKDAY_KEYS.map((day) => (
              <span key={day}>{t(`calendar.weekdays.${day}`)}</span>
            ))}
          </div>
          <div className="cal-grid">
            {cells.map((cell, index) => {
              const iso = cell.iso;
              if (!iso || cell.day === null) return <div className="cal-cell is-pad" key={`pad-${index}`} />;
              const tasks = choresOn(iso);
              const dayEvents = eventsOn(iso);
              const dayAway = awayOn(iso);
              return (
                <div className={`cal-cell${iso === today ? " is-today" : ""}`} key={iso}>
                  <span className="cal-day">{cell.day}</span>
                  {tasks.slice(0, 2).map((chore) => (
                    <Link className={`cal-event${chore.done ? " is-done" : ""}`} to="/tasks" key={chore.id}>
                      {chore.title}
                    </Link>
                  ))}
                  {dayEvents.map((item) => (
                    <span className="cal-event" key={item.id}>
                      {item.title}
                    </span>
                  ))}
                  {dayAway.map((item) => (
                    <span className="cal-event is-away" key={item.id}>
                      {awayLabel(item)}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      <form className="card grid" onSubmit={(event) => void addEvent(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("calendar.addEvent")}
        </h2>
        <label className="field">
          <span>{t("common.title")}</span>
          <input required value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder={t("calendar.garbage")} />
        </label>
        <label className="field">
          <span>{t("calendar.date")}</span>
          <input type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
        </label>
        <button className="primary" type="submit">
          {t("calendar.addEvent")}
        </button>
      </form>

      <form className="card grid" onSubmit={(event) => void addAbsence(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("calendar.away")}
        </h2>
        <label className="field">
          <span>{t("calendar.person")}</span>
          <select value={awayMember} onChange={(event) => setAwayMember(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <label className="field">
            <span>{t("calendar.from")}</span>
            <input type="date" required value={awayStart} onChange={(event) => setAwayStart(event.target.value)} />
          </label>
          <label className="field">
            <span>{t("calendar.to")}</span>
            <input type="date" required value={awayEnd} onChange={(event) => setAwayEnd(event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>{t("calendar.reason")}</span>
          <input value={awayReason} onChange={(event) => setAwayReason(event.target.value)} placeholder={t("calendar.trip")} />
        </label>
        <button className="primary" type="submit">
          {t("calendar.saveAway")}
        </button>
      </form>
    </section>
  );
}
