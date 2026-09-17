import { useState, type FormEvent } from "react";

import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { formatMoney } from "../lib/money";
import { suggestSettlements } from "./api";
import { useFinances } from "./useFinances";

export function FinancesPage() {
  const { household, members, currentMemberId } = useHousehold();
  const finances = useFinances(household?.id ?? null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentMemberId ?? "");
  const [participants, setParticipants] = useState<string[]>(members.map((member) => member.id));

  if (!household) return null;

  const memberName = (id: string) => members.find((member) => member.id === id)?.name ?? "Unknown";
  const suggestions = suggestSettlements(finances.balances);

  function toggleParticipant(id: string) {
    setParticipants((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount);
    if (!paidBy || participants.length === 0 || !Number.isFinite(value) || value <= 0) return;
    await finances.addExpense(title.trim(), value, paidBy, participants);
    setTitle("");
    setAmount("");
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Finances</h1>
          <p className="sub">Shared expenses, balances, and settlements.</p>
        </div>
        <button className="ghost" type="button" onClick={() => void finances.reload()}>
          Refresh
        </button>
      </header>

      <ErrorMessage message={finances.error} />
      {finances.loading ? <p className="empty">Loading finances…</p> : null}

      <h2 className="section-title">Balances</h2>
      {finances.balances.length === 0 ? (
        <p className="empty">No shared expenses yet. Add the first one for this household.</p>
      ) : (
        <ul className="dash-list card">
          {finances.balances.map((row) => (
            <li key={row.memberId}>
              <strong>{row.name}</strong>
              <span className={row.balance >= 0 ? "ok-msg" : "error"} style={{ margin: 0, padding: "4px 8px" }}>
                {row.balance > 0.009 ? "is owed " : row.balance < -0.009 ? "owes " : ""}
                {formatMoney(Math.abs(row.balance), household.currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length > 0 ? (
        <div className="card">
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Suggested settlements
          </h2>
          {suggestions.map((suggestion) => (
            <div className="member-card" key={`${suggestion.from.memberId}-${suggestion.to.memberId}`}>
              <p>
                {suggestion.from.name} → {suggestion.to.name}{" "}
                <strong>{formatMoney(suggestion.amount, household.currency)}</strong>
              </p>
              <button
                className="ghost"
                type="button"
                onClick={() =>
                  void finances.addSettlement(suggestion.from.memberId, suggestion.to.memberId, suggestion.amount)
                }
              >
                Mark as open
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <form className="card grid" onSubmit={(event) => void addExpense(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Add expense
        </h2>
        <label className="field">
          <span>Title</span>
          <input required placeholder="Groceries" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Amount ({household.currency})</span>
          <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="field">
          <span>Paid by</span>
          <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Split equally between</span>
          <div className="members">
            {members.map((member) => (
              <label key={member.id}>
                <input
                  type="checkbox"
                  checked={participants.includes(member.id)}
                  onChange={() => toggleParticipant(member.id)}
                />
                {member.name}
              </label>
            ))}
          </div>
        </div>
        <button className="primary" type="submit">
          Add expense
        </button>
      </form>

      <h2 className="section-title">Expenses</h2>
      {finances.expenses.length === 0 ? (
        <p className="empty">No expenses yet.</p>
      ) : (
        finances.expenses.map((expense) => (
          <article className="card" key={expense.id}>
            <h3>{expense.title}</h3>
            <p className="sub">
              {formatMoney(expense.amount, household.currency)} · paid by {memberName(expense.paidBy)} · {expense.expenseDate}
            </p>
          </article>
        ))
      )}

      <h2 className="section-title">Settlements</h2>
      {finances.settlements.length === 0 ? (
        <p className="empty">No settlements yet.</p>
      ) : (
        finances.settlements.map((settlement) => (
          <article className="card member-card" key={settlement.id}>
            <div>
              <h3>
                {memberName(settlement.fromUser)} → {memberName(settlement.toUser)}
              </h3>
              <p className="sub">
                {formatMoney(settlement.amount, household.currency)} · {settlement.status}
              </p>
            </div>
            {settlement.status === "open" ? (
              <button className="primary" type="button" onClick={() => void finances.confirm(settlement.id)}>
                Confirm paid
              </button>
            ) : null}
          </article>
        ))
      )}
    </section>
  );
}
