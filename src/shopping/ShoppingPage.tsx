import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { useShopping } from "./useShopping";

export function ShoppingPage() {
  const { user } = useAuth();
  const { household, members, currentMemberId } = useHousehold();
  const shopping = useShopping(household?.id ?? null, user?.id ?? null);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [listName, setListName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(currentMemberId ?? "");
  const [participants, setParticipants] = useState<string[]>(members.map((member) => member.id));
  const [message, setMessage] = useState("");

  if (!household) return null;

  const currency = household.currency;
  const currentListName =
    shopping.lists.find((list) => list.id === shopping.listId)?.name ?? "Shopping";
  const openItems = shopping.items.filter((item) => !item.completedAt);
  const boughtItems = shopping.items.filter((item) => item.completedAt);

  function toggleParticipant(id: string) {
    setParticipants((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = quantity.trim() ? Number(quantity) : null;
    await shopping.add(name.trim(), Number.isFinite(qty) ? qty : null, unit.trim() || null);
    setName("");
    setQuantity("");
    setUnit("");
  }

  async function addList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await shopping.addList(listName.trim());
    setListName("");
  }

  async function convert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const value = Number(amount);
    if (!paidBy || participants.length === 0 || !Number.isFinite(value) || value <= 0) return;
    try {
      await shopping.convert(currentListName, value, paidBy, participants);
      setAmount("");
      setMessage("Recorded as an expense.");
    } catch {
      // Error is shown by the shopping hook.
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <h1 className="brand">Shopping</h1>
          <p className="sub">Shared lists update live for everyone in the household.</p>
        </div>
      </header>

      <ErrorMessage message={shopping.error} />
      <SuccessMessage message={message} />

      {shopping.loading ? <p className="empty">Loading shopping lists…</p> : null}

      <div className="filters">
        {shopping.lists.map((list) => (
          <button
            key={list.id}
            className={`chip${shopping.listId === list.id ? " active" : ""}`}
            type="button"
            onClick={() => shopping.setListId(list.id)}
          >
            {list.name}
          </button>
        ))}
      </div>

      <form className="row" onSubmit={(event) => void addList(event)}>
        <label className="field">
          <span>New list</span>
          <input placeholder="Drugstore" value={listName} onChange={(event) => setListName(event.target.value)} />
        </label>
        <button className="ghost" type="submit" disabled={!listName.trim()}>
          Add list
        </button>
      </form>

      <form className="card grid" onSubmit={(event) => void addItem(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Add item
        </h2>
        <label className="field">
          <span>Item</span>
          <input required placeholder="Milk" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="row">
          <label className="field">
            <span>Quantity</span>
            <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className="field">
            <span>Unit</span>
            <input placeholder="l" value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
        </div>
        <button className="primary" type="submit">
          Add item
        </button>
      </form>

      <h2 className="section-title">To buy</h2>
      {openItems.length === 0 ? (
        <p className="empty">No shopping items yet. Add the first item to your household shopping list.</p>
      ) : (
        openItems.map((item) => (
          <article className="card chore" key={item.id}>
            <label className="chore-check">
              <input type="checkbox" checked={false} onChange={() => void shopping.toggle(item)} />
              <span className="sr-only">Purchased</span>
            </label>
            <div className="chore-body">
              <h3>{item.name}</h3>
              <div className="meta">
                {item.quantity ? <span className="pill">{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span> : null}
                {item.note ? <span>{item.note}</span> : null}
              </div>
            </div>
            <button className="danger" type="button" onClick={() => void shopping.remove(item.id)}>
              Remove
            </button>
          </article>
        ))
      )}

      {boughtItems.length > 0 ? (
        <>
          <h2 className="section-title">Purchased</h2>
          {boughtItems.map((item) => (
            <article className="card chore is-done" key={item.id}>
              <label className="chore-check">
                <input type="checkbox" checked onChange={() => void shopping.toggle(item)} />
                <span className="sr-only">Purchased</span>
              </label>
              <div className="chore-body">
                <h3>{item.name}</h3>
              </div>
            </article>
          ))}
        </>
      ) : null}

      <form className="card grid" onSubmit={(event) => void convert(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          Record as expense
        </h2>
        <p className="sub">Turn this shopping trip into a shared cost.</p>
        <label className="field">
          <span>Amount ({currency})</span>
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
          <span>Split between</span>
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
          Record as expense
        </button>
        <Link className="dash-more" to="/finances">
          Open finances
        </Link>
      </form>
    </section>
  );
}
