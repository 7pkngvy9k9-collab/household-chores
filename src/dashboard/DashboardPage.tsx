import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorMessage } from "../components/Feedback";
import { Icon } from "../components/Icons";
import { fetchBalances } from "../finance/api";
import { useHousehold } from "../household/HouseholdProvider";
import { formatMoney } from "../lib/money";
import { fetchShoppingItems, fetchShoppingLists } from "../shopping/api";
import { useHouseholdChores } from "../tasks/ChoresProvider";
import { isDue, isWaitingFor, todayISO } from "../tasks/schedule";

export function DashboardPage() {
  const { household, members, currentMemberId } = useHousehold();
  const { chores, loading, error, reload } = useHouseholdChores();
  const [openShopping, setOpenShopping] = useState<number | null>(null);
  const [myBalance, setMyBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!household) return;
    let active = true;
    void (async () => {
      try {
        const lists = await fetchShoppingLists(household.id);
        const itemGroups = await Promise.all(lists.map((list) => fetchShoppingItems(list.id)));
        const open = itemGroups.flat().filter((item) => !item.completedAt).length;
        if (active) setOpenShopping(open);
      } catch {
        if (active) setOpenShopping(0);
      }
      try {
        const balances = await fetchBalances(household.id);
        const mine = balances.find((row) => row.memberId === currentMemberId);
        if (active) setMyBalance(mine?.balance ?? 0);
      } catch {
        if (active) setMyBalance(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [household, currentMemberId]);

  if (!household) return null;

  const today = todayISO();
  const mine = chores.filter((chore) => isWaitingFor(chore, currentMemberId, today));
  const dueToday = chores.filter((chore) => isDue(chore, today));
  const open = chores.filter((chore) => !chore.done);
  const doneCount = chores.filter((chore) => chore.done).length;
  const completionRate =
    chores.length === 0 ? 0 : Math.round((doneCount / chores.length) * 100);

  const financeCopy =
    myBalance === null
      ? "Loading balances…"
      : myBalance > 0.009
        ? `You are owed ${formatMoney(myBalance, household.currency)}`
        : myBalance < -0.009
          ? `You owe ${formatMoney(Math.abs(myBalance), household.currency)}`
          : "You are settled up.";

  return (
    <section>
      <header className="page-head">
        <div>
          <h1 className="brand">{household.name}</h1>
        </div>
        <button className="icon-btn" type="button" onClick={() => void reload()}>
          <Icon name="refresh" />
          Refresh
        </button>
      </header>

      <ErrorMessage message={error} />

      {loading ? <p className="empty">Loading your household…</p> : null}

      <ul className="stat-strip">
        <li>
          <strong>{members.length}</strong>
          <span>Members</span>
        </li>
        <li>
          <strong>{dueToday.length}</strong>
          <span>Due today</span>
        </li>
        <li>
          <strong>{open.length}</strong>
          <span>Open tasks</span>
        </li>
        <li>
          <strong>{completionRate}%</strong>
          <span>Done</span>
        </li>
      </ul>

      <div className="dash-grid">
        <article className="card dash-card">
          <p className="dash-kicker">
            <Icon name="tasks" /> My tasks
          </p>
          {mine.length === 0 ? (
            <p className="empty">Nothing waiting for you right now.</p>
          ) : (
            <ul className="dash-list">
              {mine.slice(0, 4).map((chore) => (
                <li key={chore.id}>
                  <Link to="/tasks">{chore.title}</Link>
                  <span className="sub">{chore.dueDate === today ? "Today" : (chore.dueDate ?? "On demand")}</span>
                </li>
              ))}
            </ul>
          )}
          <Link className="dash-more" to="/tasks">
            Open tasks
          </Link>
        </article>

        <article className="card dash-card">
          <p className="dash-kicker">
            <Icon name="shopping" /> Shopping
          </p>
          <p className="metric">
            {openShopping === null
              ? "Loading shopping…"
              : openShopping === 0
                ? "No shopping items yet. Add the first item for your household."
                : `${openShopping} item${openShopping === 1 ? "" : "s"} to buy.`}
          </p>
          <Link className="dash-more" to="/shopping">
            Open shopping
          </Link>
        </article>

        <article className="card dash-card">
          <p className="dash-kicker">
            <Icon name="finances" /> Finances
          </p>
          <p className="metric">{financeCopy}</p>
          <Link className="dash-more" to="/finances">
            Open finances
          </Link>
        </article>

        <article className="card dash-card">
          <p className="dash-kicker">
            <Icon name="members" /> Household
          </p>
          <p className="metric">{members.map((member) => member.name).join(" · ")}</p>
          <Link className="dash-more" to="/members">
            Open members
          </Link>
        </article>
      </div>
    </section>
  );
}
