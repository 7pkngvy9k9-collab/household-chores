import { ListRow } from "../components/ListRow";
import { useI18n } from "../i18n/LocaleProvider";
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
  const { t } = useI18n();
  const holderId = currentHolder(chore);
  const mine = isAssignedTo(chore, currentMemberId);
  const holder = holderId ? memberName(holderId) : t("common.anyone");
  const meta = [
    scheduleLabel(chore, t),
    holder,
    chore.kind === "repeating" && chore.rotate ? t("tasks.rotates") : null,
    isOverdue(chore) ? t("tasks.overdue") : null,
    chore.lastDoneBy ? t("tasks.last", { name: memberName(chore.lastDoneBy) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      title={chore.title}
      meta={meta}
      mark={holder.trim().slice(0, 1).toUpperCase()}
      mine={mine}
      overdue={isOverdue(chore)}
      checked={chore.done}
      completeLabel={chore.done ? t("tasks.reopen", { title: chore.title }) : t("tasks.markDone", { title: chore.title })}
      onToggle={(next) => (next ? onComplete(chore.id) : onReopen(chore.id))}
      onRemove={() => {
        if (window.confirm(t("tasks.removeConfirm"))) onRemove(chore.id);
      }}
    />
  );
}
