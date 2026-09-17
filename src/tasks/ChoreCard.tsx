import { currentHolder, isAssignedTo, isOverdue, scheduleLabel } from "./schedule";
import type { Chore } from "./types";

type Props = {
  chore: Chore;
  currentMemberId: string | null;
  memberName: (id: string) => string;
  onComplete: (id: string) => void;
  onReopen: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ChoreCard({
  chore,
  currentMemberId,
  memberName,
  onComplete,
  onReopen,
  onRemove,
}: Props) {
  const holderId = currentHolder(chore);
  const mine = isAssignedTo(chore, currentMemberId);

  return (
    <article className={`card chore${chore.done ? " is-done" : ""}`}>
      <label className="chore-check done-check" title="Done">
        <input
          type="checkbox"
          checked={chore.done}
          onChange={(event) =>
            event.target.checked ? onComplete(chore.id) : onReopen(chore.id)
          }
        />
        <span className="sr-only">Done</span>
      </label>

      <div className="chore-body">
        <h3>{chore.title}</h3>
        <div className="meta">
          <span className="pill">{scheduleLabel(chore)}</span>
          <span className={`pill${mine ? " mine" : ""}`}>
            {holderId ? memberName(holderId) : "Anyone"}
          </span>
          {chore.kind === "repeating" && chore.rotate ? <span className="pill">Rotates</span> : null}
          {isOverdue(chore) ? <span className="pill overdue">Overdue</span> : null}
          {chore.lastDoneBy ? (
            <span className="last">Last: {memberName(chore.lastDoneBy)}</span>
          ) : null}
        </div>
      </div>

      <label className="chore-check remove-check" title="Remove">
        <input
          type="checkbox"
          checked={false}
          onChange={() => {
            if (window.confirm("Remove this chore?")) onRemove(chore.id);
          }}
        />
        <span>Remove</span>
      </label>
    </article>
  );
}
