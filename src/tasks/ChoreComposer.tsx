import { useState, type FormEvent } from "react";

import type { Member } from "../household/HouseholdProvider";
import { useI18n } from "../i18n/LocaleProvider";
import { todayISO } from "./schedule";
import type { ChoreKind, ChoreRepeat, NewChore } from "./types";

type Props = {
  members: Member[];
  onAdd: (chore: NewChore) => void;
};

const FORM_ID = "chore-form";

export function ChoreComposer({ members, onAdd }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ChoreKind>("repeating");
  const [repeat, setRepeat] = useState<ChoreRepeat>("weekly");
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [dueDate, setDueDate] = useState(todayISO());
  const [rotate, setRotate] = useState(true);
  const [holderIds, setHolderIds] = useState<string[]>([]);

  function openSheet() {
    setTitle("");
    setKind("repeating");
    setRepeat("weekly");
    setRepeatInterval(1);
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
      repeatInterval: kind === "repeating" ? Math.max(1, repeatInterval) : 1,
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
            <section className="card composer-sheet" aria-label={t("tasks.addAria")}>
            <div className="composer-head">
              <h2 className="section-title" style={{ margin: 0 }}>
                {t("tasks.add")}
              </h2>
              <button className="ghost" type="button" onClick={() => setOpen(false)}>
                {t("common.close")}
              </button>
            </div>

            <form id={FORM_ID} className="grid" onSubmit={handleSubmit}>
              <label className="field">
                <span>{t("tasks.what")}</span>
                <input
                  required
                  autoFocus
                  placeholder={t("tasks.placeholder")}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                />
              </label>

              <div className="row">
                <label className="field">
                  <span>{t("tasks.when")}</span>
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value as ChoreKind)}
                  >
                    <option value="repeating">{t("tasks.repeating")}</option>
                    <option value="dated">{t("tasks.dated")}</option>
                    <option value="on_demand">{t("tasks.onDemand")}</option>
                  </select>
                </label>

                {kind === "repeating" ? (
                  <>
                    <label className="field">
                      <span>{t("tasks.repeat")}</span>
                      <select
                        value={repeat}
                        onChange={(event) => setRepeat(event.target.value as ChoreRepeat)}
                      >
                        <option value="daily">{t("tasks.daily")}</option>
                        <option value="weekly">{t("tasks.weekly")}</option>
                        <option value="monthly">{t("tasks.monthly")}</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>{t("tasks.every")}</span>
                      <input
                        type="number"
                        min={1}
                        value={repeatInterval}
                        onChange={(event) => setRepeatInterval(Number(event.target.value) || 1)}
                      />
                    </label>
                  </>
                ) : null}

                {kind === "on_demand" ? null : (
                  <label className="field">
                    <span>{t("tasks.firstDue")}</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="field">
                <span>{t("tasks.who")}</span>
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
                  {t("tasks.rotate")}
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
          {t("tasks.add")}
        </button>
      </div>
    </div>
  );
}
