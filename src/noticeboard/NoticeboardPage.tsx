import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ErrorMessage } from "../components/Feedback";
import { useHousehold } from "../household/HouseholdProvider";
import { reportError } from "../lib/errors";
import { useRealtimeTable } from "../lib/realtime";
import { supabase } from "../lib/supabase";

type Post = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  authorId: string;
  createdAt: string;
};

export function NoticeboardPage() {
  const { household, members, currentMemberId } = useHousehold();
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!household) return;
    const { data, error: queryError } = await supabase
      .from("posts")
      .select("*")
      .eq("household_id", household.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (queryError) {
      setError(reportError(queryError, "Posts could not be loaded."));
      return;
    }
    setPosts(
      data.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        pinned: row.pinned,
        authorId: row.author_id,
        createdAt: row.created_at,
      })),
    );
  }, [household]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable("posts", "posts", household ? `household_id=eq.${household.id}` : undefined, load);

  if (!household || !currentMemberId) return null;
  const householdId = household.id;
  const authorId = currentMemberId;

  async function addPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: insertError } = await supabase.from("posts").insert({
      household_id: householdId,
      author_id: authorId,
      title: title.trim(),
      body: body.trim(),
    });
    if (insertError) {
      setError(reportError(insertError, "The post could not be added."));
      setBusy(false);
      return;
    }
    await supabase.rpc("notify_household", {
      p_household_id: householdId,
      p_title: "New noticeboard post",
      p_body: title.trim(),
    });
    setTitle("");
    setBody("");
    await load();
    setBusy(false);
  }

  async function togglePin(post: Post) {
    await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", post.id);
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this post?")) return;
    await supabase.from("posts").delete().eq("id", id);
    await load();
  }

  const authorName = (id: string) => members.find((member) => member.id === id)?.name ?? "Someone";

  return (
    <section>
      <header className="page-head">
        <div>
          <h1 className="brand">Pinboard</h1>
        </div>
      </header>
      <ErrorMessage message={error} />
      <form className="card grid" onSubmit={(event) => void addPost(event)}>
        <label className="field">
          <span>Title</span>
          <input required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          <span>Note</span>
          <textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} />
        </label>
        <button className="primary" type="submit" disabled={busy}>
          Pin a note
        </button>
      </form>
      {posts.length === 0 ? (
        <p className="empty">No posts yet. Pin notes the household should see.</p>
      ) : (
        posts.map((post) => (
          <article className={`card notice-card${post.pinned ? " is-pinned" : ""}`} key={post.id}>
            <h3>{post.title}</h3>
            <p className="sub">
              {authorName(post.authorId)} · {new Date(post.createdAt).toLocaleString()}
            </p>
            {post.body ? <p>{post.body}</p> : null}
            <div className="member-actions">
              <button className="ghost" type="button" onClick={() => void togglePin(post)}>
                {post.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="danger" type="button" onClick={() => void remove(post.id)}>
                Remove
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}
