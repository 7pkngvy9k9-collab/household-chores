import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useHousehold } from "../household/HouseholdProvider";
import { useHouseholdChores } from "../tasks/ChoresProvider";
import { todayISO, toISODate } from "../tasks/schedule";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const { household } = useHousehold();
  const { chores } = useHouseholdChores();
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });

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

  const byDate = useMemo(() => {
    const map = new Map<string, typeof chores>();
    for (const chore of chores) {
      if (!chore.dueDate) continue;
      const list = map.get(chore.dueDate) ?? [];
      list.push(chore);
      map.set(chore.dueDate, list);
    }
    return map;
  }, [chores]);

  if (!household) return null;

  const label = startOfMonth(cursor.year, cursor.month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Calendar</h1>
          <p className="sub">Task due dates for this household. Meetings and absences come later.</p>
        </div>
        <div className="cal-nav">
          <button
            className="icon-btn"
            type="button"
            onClick={() => setCursor((current) => addMonths(current.year, current.month, -1))}
          >
            Prev
          </button>
          <button className="icon-btn" type="button" onClick={() => setCursor({ year: now.getFullYear(), month: now.getMonth() })}>
            Today
          </button>
          <button
            className="icon-btn"
            type="button"
            onClick={() => setCursor((current) => addMonths(current.year, current.month, 1))}
          >
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
          if (!cell.iso || cell.day === null) {
            return <div className="cal-cell is-pad" key={`pad-${index}`} />;
          }
          const items = byDate.get(cell.iso) ?? [];
          return (
            <div className={`cal-cell${cell.iso === today ? " is-today" : ""}`} key={cell.iso}>
              <span className="cal-day">{cell.day}</span>
              {items.slice(0, 3).map((chore) => (
                <Link className={`cal-event${chore.done ? " is-done" : ""}`} to="/tasks" key={chore.id}>
                  {chore.title}
                </Link>
              ))}
              {items.length > 3 ? <span className="cal-more">+{items.length - 3}</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
