import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";

type Poll = { id: string; question: string };
type Option = { id: string; pollId: string; label: string };
type Vote = { pollId: string; optionId: string; memberId: string };

export function PollsPage() {
  const { household, members, currentMemberId } = useHousehold();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [question, setQuestion] = useState("");
  const [optionText, setOptionText] = useState("Yes\nNo");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!household) return;
    const [pollRows, optionRows, voteRows] = await Promise.all([
      supabase.from("polls").select("*").eq("household_id", household.id).order("created_at", { ascending: false }),
      supabase.from("poll_options").select("*"),
      supabase.from("poll_votes").select("*"),
    ]);
    const fail = pollRows.error ?? optionRows.error ?? voteRows.error;
    if (fail) {
      setError(reportError(fail, "Polls could not be loaded."));
      return;
    }
    setPolls((pollRows.data ?? []).map((row) => ({ id: row.id, question: row.question })));
    setOptions((optionRows.data ?? []).map((row) => ({ id: row.id, pollId: row.poll_id, label: row.label })));
    setVotes(
      (voteRows.data ?? []).map((row) => ({ pollId: row.poll_id, optionId: row.option_id, memberId: row.member_id })),
    );
  }, [household]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!household || !currentMemberId) return null;
  const householdId = household.id;
  const voterId = currentMemberId;

  async function addPoll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const labels = optionText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (labels.length < 2) return;
    const { data, error: insertError } = await supabase
      .from("polls")
      .insert({ household_id: householdId, question: question.trim(), created_by: voterId })
      .select("id")
      .single();
    if (insertError || !data) {
      setError(reportError(insertError, "The poll could not be created."));
      return;
    }
    await supabase.from("poll_options").insert(labels.map((label, position) => ({ poll_id: data.id, label, position })));
    await supabase.rpc("notify_household", {
      p_household_id: householdId,
      p_title: "New poll",
      p_body: question.trim(),
    });
    setQuestion("");
    await load();
  }

  async function vote(pollId: string, optionId: string) {
    await supabase.from("poll_votes").upsert(
      { poll_id: pollId, option_id: optionId, member_id: voterId },
      { onConflict: "poll_id,member_id" },
    );
    await load();
  }

  return (
    <section>
      <header className="page-head">
        <div>
          <p className="eyebrow">{household.name}</p>
          <h1 className="brand">Polls</h1>
          <p className="sub">One vote per person. Change it any time.</p>
        </div>
      </header>
      <ErrorMessage message={error} />
      <form className="card grid" onSubmit={(event) => void addPoll(event)}>
        <label className="field">
          <span>Question</span>
          <input required value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <label className="field">
          <span>Options (one per line)</span>
          <textarea rows={3} value={optionText} onChange={(event) => setOptionText(event.target.value)} />
        </label>
        <button className="primary" type="submit">
          Create poll
        </button>
      </form>
      {polls.length === 0 ? (
        <p className="empty">No polls yet.</p>
      ) : (
        polls.map((poll) => {
          const choices = options.filter((option) => option.pollId === poll.id);
          return (
            <article className="card" key={poll.id}>
              <h3>{poll.question}</h3>
              {choices.map((option) => {
                const count = votes.filter((row) => row.optionId === option.id).length;
                const mine = votes.some(
                  (row) => row.pollId === poll.id && row.optionId === option.id && row.memberId === voterId,
                );
                return (
                  <button
                    className={`chip${mine ? " active" : ""}`}
                    key={option.id}
                    type="button"
                    onClick={() => void vote(poll.id, option.id)}
                  >
                    {option.label} · {count}
                  </button>
                );
              })}
              <p className="sub">{members.length} people in the household</p>
            </article>
          );
        })
      )}
    </section>
  );
}
