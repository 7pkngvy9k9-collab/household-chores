import { useEffect, useRef, useState, type ReactNode } from "react";

import { CompleteToggle } from "./CompleteToggle";
import { Icon } from "./Icons";
import { useI18n } from "../i18n/LocaleProvider";

type Props = {
  title: string;
  meta?: ReactNode;
  mark?: string;
  mine?: boolean;
  glyph?: string;
  overdue?: boolean;
  checked: boolean;
  completeLabel: string;
  onToggle: (next: boolean) => void;
  onRemove?: () => void;
  removeLabel?: string;
};

export function ListRow({
  title,
  meta,
  mark,
  mine = false,
  glyph,
  overdue,
  checked,
  completeLabel,
  onToggle,
  onRemove,
  removeLabel = "Remove",
}: Props) {
  const { t } = useI18n();
  return (
    <article className={`list-row${checked ? " is-done" : ""}`}>
      <CompleteToggle checked={checked} label={completeLabel} onChange={onToggle} />
      <button type="button" className="list-row-main" onClick={() => onToggle(!checked)}>
        <span className="list-row-title">
          {glyph ? <Icon name={glyph} className="icon list-row-glyph" /> : null}
          {title}
        </span>
        {meta ? <span className="list-row-meta">{meta}</span> : null}
      </button>
      {mark ? (
        <span
          className={`who-slot${mine && !checked ? " is-mine" : ""}`}
          aria-label={mine && !checked ? t("tasks.myTurn") : undefined}
        >
          <span
            className={`who-mark${overdue ? " is-overdue" : ""}${mine && !checked ? " is-mine" : ""}`}
            aria-hidden="true"
          >
            {mark}
          </span>
          {mine && !checked ? (
            <span className="who-caption" aria-hidden="true">
              {t("tasks.turnMark")}
            </span>
          ) : null}
        </span>
      ) : null}
      {onRemove ? <RowMenu label={`${removeLabel} ${title}`} onRemove={onRemove} /> : null}
    </article>
  );
}

function RowMenu({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="row-menu" ref={root}>
      <button
        type="button"
        className="row-action"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Icon name="more" />
      </button>
      {open ? (
        <div className="row-menu-panel">
          <button
            type="button"
            className="row-menu-item"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            {t("list.remove")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
