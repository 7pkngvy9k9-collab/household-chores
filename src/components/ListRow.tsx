import { useEffect, useRef, useState, type ReactNode } from "react";

import { CompleteToggle } from "./CompleteToggle";
import { Icon } from "./Icons";

type Props = {
  title: string;
  meta?: ReactNode;
  checked: boolean;
  completeLabel: string;
  onToggle: (next: boolean) => void;
  onRemove?: () => void;
  removeLabel?: string;
};

export function ListRow({
  title,
  meta,
  checked,
  completeLabel,
  onToggle,
  onRemove,
  removeLabel = "Remove",
}: Props) {
  return (
    <article className={`list-row${checked ? " is-done" : ""}`}>
      <CompleteToggle checked={checked} label={completeLabel} onChange={onToggle} />
      <button type="button" className="list-row-main" onClick={() => onToggle(!checked)}>
        <span className="list-row-title">{title}</span>
        {meta ? <span className="list-row-meta">{meta}</span> : null}
      </button>
      {onRemove ? <RowMenu label={`${removeLabel} ${title}`} onRemove={onRemove} /> : null}
    </article>
  );
}

function RowMenu({ label, onRemove }: { label: string; onRemove: () => void }) {
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
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
