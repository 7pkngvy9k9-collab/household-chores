import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../auth/AuthProvider";
import { ErrorMessage, SuccessMessage } from "../components/Feedback";
import { ListRow } from "../components/ListRow";
import { Icon } from "../components/Icons";
import { useHousehold } from "../household/HouseholdProvider";
import { useI18n } from "../i18n/LocaleProvider";
import { groupByCategory } from "./categories";
import { displayItemName } from "./glossary";
import { useShopping } from "./useShopping";

export function ShoppingPage() {
  const { user } = useAuth();
  const { household, members, currentMemberId } = useHousehold();
  const shopping = useShopping(household?.id ?? null, user?.id ?? null);
  const { t, locale } = useI18n();

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
      setMessage(t("shopping.recorded"));
    } catch {
      // Error is shown by the shopping hook.
    }
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <h1 className="brand">{t("shopping.title")}</h1>
        </div>
      </header>

      <ErrorMessage message={shopping.error} />
      <SuccessMessage message={message} />

      {shopping.loading ? <p className="empty">{t("shopping.loading")}</p> : null}

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
          <span>{t("shopping.newList")}</span>
          <input placeholder={t("shopping.drugstore")} value={listName} onChange={(event) => setListName(event.target.value)} />
        </label>
        <button className="ghost" type="submit" disabled={!listName.trim()}>
          {t("shopping.addList")}
        </button>
      </form>

      <form className="card grid" onSubmit={(event) => void addItem(event)}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {t("shopping.addItem")}
        </h2>
        <label className="field">
          <span>{t("shopping.item")}</span>
          <input required placeholder={t("shopping.milk")} value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <div className="row">
          <label className="field">
            <span>{t("shopping.quantity")}</span>
            <input inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label className="field">
            <span>{t("shopping.unit")}</span>
            <input placeholder="l" value={unit} onChange={(event) => setUnit(event.target.value)} />
          </label>
        </div>
        <button className="primary" type="submit">
          {t("shopping.addItem")}
        </button>
      </form>

      <h2 className="section-title">{t("shopping.toBuy")}</h2>
      {openItems.length === 0 ? (
        <p className="empty">{t("shopping.empty")}</p>
      ) : (
        <div className="checklist">
          {groupByCategory(openItems).map((group) => (
            <div key={group.id}>
              <p className="shop-cat">
                <Icon name={group.icon} className="icon shop-cat-icon" />
                {t(`shopping.cat.${group.id}`)}
              </p>
              {group.items.map((item) => {
                const shown = displayItemName(item.name, locale);
                return (
                  <ListRow
                    key={item.id}
                    title={shown}
                    glyph={group.icon}
                    meta={
                      [item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : null, item.note]
                        .filter(Boolean)
                        .join(" · ") || undefined
                    }
                    checked={false}
                    completeLabel={t("shopping.markBought", { name: shown })}
                    onToggle={() => void shopping.toggle(item)}
                    onRemove={() => void shopping.remove(item.id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}

      {boughtItems.length > 0 ? (
        <>
          <h2 className="section-title">{t("shopping.bought")}</h2>
          <div className="checklist">
            {boughtItems.map((item) => {
              const shown = displayItemName(item.name, locale);
              return (
                <ListRow
                  key={item.id}
                  title={shown}
                  checked
                  completeLabel={t("shopping.putBack", { name: shown })}
                  onToggle={() => void shopping.toggle(item)}
                />
              );
            })}
          </div>
        </>
      ) : null}

      <form className="card grid" onSubmit={(event) => void convert(event)}>
          <h2 className="section-title" style={{ margin: 0 }}>
          {t("shopping.convert")}
        </h2>
        <p className="sub">{t("shopping.convertSub")}</p>
        <label className="field">
          <span>{t("common.amount", { currency })}</span>
          <input required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <label className="field">
          <span>{t("common.paidBy")}</span>
          <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>{t("shopping.split")}</span>
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
          {t("shopping.record")}
        </button>
        <Link className="dash-more" to="/finances">
          {t("shopping.openFinances")}
        </Link>
      </form>
    </section>
  );
}
