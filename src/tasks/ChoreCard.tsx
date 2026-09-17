import { ListRow } from "../components/ListRow";
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
  const holder = holderId ? memberName(holderId) : "Anyone";
  const meta = [
    scheduleLabel(chore),
    holder,
    chore.kind === "repeating" && chore.rotate ? "Rotates" : null,
    isOverdue(chore) ? "Overdue" : null,
    chore.lastDoneBy ? `Last: ${memberName(chore.lastDoneBy)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      title={chore.title}
      meta={
        <span className={mine ? "is-mine" : undefined}>
          {meta}
        </span>
      }
      checked={chore.done}
      completeLabel={chore.done ? `Reopen ${chore.title}` : `Mark ${chore.title} done`}
      onToggle={(next) => (next ? onComplete(chore.id) : onReopen(chore.id))}
      onRemove={() => {
        if (window.confirm("Remove this chore?")) onRemove(chore.id);
      }}
    />
  );
}
