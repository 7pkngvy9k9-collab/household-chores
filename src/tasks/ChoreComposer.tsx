import { useState, type FormEvent } from "react";

import type { Member } from "../household/HouseholdProvider";
import { todayISO } from "./schedule";
import type { ChoreKind, ChoreRepeat, NewChore } from "./types";

type Props = {
  members: Member[];
  onAdd: (chore: NewChore) => void;
};

const FORM_ID = "chore-form";

export function ChoreComposer({ members, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ChoreKind>("repeating");
  const [repeat, setRepeat] = useState<ChoreRepeat>("weekly");
  const [dueDate, setDueDate] = useState(todayISO());
  const [rotate, setRotate] = useState(true);
  const [holderIds, setHolderIds] = useState<string[]>([]);

  function openSheet() {
    setTitle("");
    setKind("repeating");
    setRepeat("weekly");
    setDueDate(todayISO());
    setRotate(true);
    setHolderIds(members.map((member) => member.id));
    setOpen(true);
  }

  function toggleHolder(id: string) {
    setHolderIds((current) =>
      current.includes(id) ? current.filter((held) => held !== id) : [...current, id],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd({
      title: title.trim(),
      kind,
      repeat: kind === "repeating" ? repeat : "none",
      dueDate: kind === "on_demand" ? null : dueDate || todayISO(),
      // Rotation only means something with more than one candidate.
      rotate: kind === "repeating" && rotate && holderIds.length > 1,
      holderIds,
    });
    setOpen(false);
  }

  return (
    <div className={`composer-dock${open ? " open" : ""}`}>
      <div className="composer-inner">
        {open ? (
          <section className="card composer-sheet" aria-label="Add a chore">
            <div className="composer-head">
              <h2 className="section-title" style={{ margin: 0 }}>
                Add a chore
              </h2>
              <button className="ghost" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <form id={FORM_ID} className="grid" onSubmit={handleSubmit}>
              <label className="field">
                <span>What needs doing?</span>
                <input
                  required
                  autoFocus
                  placeholder="Take out recycling"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <div className="row">
                <label className="field">
                  <span>When</span>
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value as ChoreKind)}
                  >
                    <option value="repeating">Repeating</option>
                    <option value="dated">On a date</option>
                    <option value="on_demand">On demand</option>
                  </select>
                </label>

                {kind === "repeating" ? (
                  <label className="field">
                    <span>Repeat</span>
                    <select
                      value={repeat}
                      onChange={(event) => setRepeat(event.target.value as ChoreRepeat)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </label>
                ) : null}

                {kind === "on_demand" ? null : (
                  <label className="field">
                    <span>First / due date</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="field">
                <span>Who does it?</span>
                <div className="members">
                  {members.map((member) => (
                    <label key={member.id}>
                      <input
                        type="checkbox"
                        checked={holderIds.includes(member.id)}
                        onChange={() => toggleHolder(member.id)}
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
              </div>

              {kind === "repeating" ? (
                <label className="members">
                  <input
                    type="checkbox"
                    checked={rotate}
                    onChange={(event) => setRotate(event.target.checked)}
                  />
                  Alternate between selected people after each completion
                </label>
              ) : null}
            </form>
          </section>
        ) : null}

        <button
          className="primary add-chore-btn"
          type={open ? "submit" : "button"}
          form={open ? FORM_ID : undefined}
          onClick={open ? undefined : openSheet}
        >
          Add a chore
        </button>
      </div>
    </div>
  );
}
