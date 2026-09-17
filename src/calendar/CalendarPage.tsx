import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useHousehold } from "../household/HouseholdProvider";
import { supabase } from "../lib/supabase";
import { useHouseholdChores } from "../tasks/ChoresProvider";
import { todayISO, toISODate } from "../tasks/schedule";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalEvent = { id: string; title: string; date: string };
type Absence = { id: string; memberId: string; start: string; end: string; reason: string | null };

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function CalendarPage() {
  const { household, members, currentMemberId } = useHousehold();
  const { chores } = useHouseholdChores();
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
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

  const cells = useMemo(() => {
    const first = startOfMonth(cursor.year, cursor.month);
    const lead = mondayIndex(first);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const total = Math.ceil((lead + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const day = index - lead + 1;
      if (day < 1 || day > daysInMonth) return { iso: null as string | null, day: null as number | null };
      return { iso: toISODate(new Date(cursor.year, cursor.month, day)), day };
    });
  }, [cursor]);

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

  const label = startOfMonth(cursor.year, cursor.month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const memberName = (id: string) => members.find((member) => member.id === id)?.name ?? "Someone";

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Calendar</h1>
          <p className="sub">Tasks, household events, and who is away.</p>
        </div>
        <div className="cal-nav">
          <button className="icon-btn" type="button" onClick={() => setCursor((current) => addMonths(current.year, current.month, -1))}>
            Prev
          </button>
          <button className="icon-btn" type="button" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>
            Today
          </button>
          <button className="icon-btn" type="button" onClick={() => setCursor((current) => addMonths(current.year, current.month, 1))}>
            Next
          </button>
        </div>
      </header>

      <h2 className="section-title" style={{ marginTop: 0 }}>
        {label}
      </h2>
      <div className="cal-weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((cell, index) => {
          const iso = cell.iso;
          if (!iso || cell.day === null) return <div className="cal-cell is-pad" key={`pad-${index}`} />;
          const tasks = chores.filter((chore) => chore.dueDate === iso);
          const dayEvents = events.filter((item) => item.date === iso);
          const dayAway = absences.filter((item) => item.start <= iso && item.end >= iso);
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
                  {memberName(item.memberId)} away
                </span>
              ))}
            </div>
          );
        })}
      </div>

      <form className="card grid" onSubmit={(event) => void addEvent(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Add event
        </h2>
        <label className="field">
          <span>Title</span>
          <input required value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} placeholder="Garbage day" />
        </label>
        <label className="field">
          <span>Date</span>
          <input type="date" required value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
        </label>
        <button className="primary" type="submit">
          Add event
        </button>
      </form>

      <form className="card grid" onSubmit={(event) => void addAbsence(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Who is away
        </h2>
        <label className="field">
          <span>Person</span>
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
            <span>From</span>
            <input type="date" required value={awayStart} onChange={(event) => setAwayStart(event.target.value)} />
          </label>
          <label className="field">
            <span>Until</span>
            <input type="date" required value={awayEnd} onChange={(event) => setAwayEnd(event.target.value)} />
          </label>
        </div>
        <label className="field">
          <span>Reason</span>
          <input value={awayReason} onChange={(event) => setAwayReason(event.target.value)} placeholder="Trip home" />
        </label>
        <button className="primary" type="submit">
          Add absence
        </button>
      </form>
    </section>
  );
}
