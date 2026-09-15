const THEME_KEY = "household-chores.theme";
const { supabaseUrl, supabaseAnonKey, siteUrl } = window.APP_CONFIG;

const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayISO = () => toISODate(new Date());

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function mapChore(row) {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    repeat: row.repeat,
    dueDate: row.due_date,
    rotate: row.rotate,
    holderIds: row.holder_ids || [],
    holderIndex: row.holder_index || 0,
    done: row.done,
    lastDoneAt: row.last_done_at,
    lastDoneBy: row.last_done_by,
  };
}

function choreToRow(chore, householdId) {
  return {
    id: chore.id,
    household_id: householdId,
    title: chore.title,
    kind: chore.kind,
    repeat: chore.repeat,
    due_date: chore.dueDate,
    rotate: chore.rotate,
    holder_ids: chore.holderIds,
    holder_index: chore.holderIndex,
    done: chore.done,
    last_done_at: chore.lastDoneAt,
    last_done_by: chore.lastDoneBy,
    updated_at: new Date().toISOString(),
  };
}

let state = {
  boot: true,
  user: null,
  email: "",
  authMessage: "",
  authError: "",
  householdId: "",
  householdName: "",
  inviteCode: "",
  members: [],
  currentMemberId: "",
  chores: [],
  joinCode: "",
  joinMembers: [],
  joinHouseholdName: "",
  notifyAsked: false,
  darkMode: localStorage.getItem(THEME_KEY) === "1",
  busy: false,
  error: "",
};

let composerOpen = false;

function openChoreComposer() {
  composerOpen = true;
  render();
}

function closeChoreComposer() {
  composerOpen = false;
  render();
}

function setBusy(busy, error = "") {
  state.busy = busy;
  state.error = error;
  render();
}

function applyTheme() {
  document.documentElement.classList.toggle("theme-dark", Boolean(state.darkMode));
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  localStorage.setItem(THEME_KEY, state.darkMode ? "1" : "0");
  applyTheme();
  render();
}

function themeToggleButton() {
  return `<button class="ghost" id="toggle-theme" type="button">${
    state.darkMode ? "Light mode" : "Dark mode"
  }</button>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currentMember() {
  return state.members.find((m) => m.id === state.currentMemberId);
}

function memberName(id) {
  return state.members.find((m) => m.id === id)?.name ?? "Anyone";
}

function currentHolder(chore) {
  if (!chore.holderIds.length) return null;
  return chore.holderIds[chore.holderIndex % chore.holderIds.length];
}

function isMine(chore) {
  const holder = currentHolder(chore);
  return !holder || holder === state.currentMemberId;
}

function isDue(chore) {
  if (chore.kind === "on_demand" || chore.done) return false;
  return Boolean(chore.dueDate && chore.dueDate <= todayISO());
}

function isUpcoming(chore) {
  if (chore.kind === "on_demand" || chore.done) return false;
  return chore.dueDate && chore.dueDate > todayISO();
}

function scheduleLabel(chore) {
  if (chore.kind === "on_demand") return "On demand";
  if (chore.kind === "repeating") {
    return `${chore.repeat === "daily" ? "Daily" : "Weekly"} · next ${chore.dueDate}`;
  }
  return `On ${chore.dueDate}`;
}

function waitingForMe(chore) {
  if (!isMine(chore) || chore.done) return false;
  if (chore.kind === "on_demand") return true;
  return isDue(chore);
}

function dueForCurrentUser() {
  return state.chores.filter(waitingForMe);
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    alert("This browser does not support notifications.");
    return;
  }
  const permission = await Notification.requestPermission();
  state.notifyAsked = true;
  if (permission === "granted") pingDueNotification();
  render();
}

function pingDueNotification() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const due = dueForCurrentUser();
  if (!due.length) return;
  const who = currentMember()?.name ?? "you";
  new Notification("Household chores", {
    body: `${who}: ${due.length} chore${due.length === 1 ? "" : "s"} waiting.`,
  });
}

async function loadHouseholdForUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  state.user = user;
  if (!user) {
    state.householdId = "";
    state.members = [];
    state.chores = [];
    state.currentMemberId = "";
    return;
  }

  const { data: member, error: memberError } = await supabase
    .from("members")
    .select("id, household_id, name, households(id, name, invite_code)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member) {
    state.householdId = "";
    state.members = [];
    state.chores = [];
    state.currentMemberId = "";
    return;
  }

  state.currentMemberId = member.id;
  state.householdId = member.household_id;
  state.householdName = member.households.name;
  state.inviteCode = member.households.invite_code;

  const [{ data: members, error: membersError }, { data: chores, error: choresError }] =
    await Promise.all([
      supabase
        .from("members")
        .select("id, name")
        .eq("household_id", state.householdId)
        .order("created_at"),
      supabase
        .from("chores")
        .select("*")
        .eq("household_id", state.householdId)
        .order("created_at", { ascending: false }),
    ]);

  if (membersError) throw membersError;
  if (choresError) throw choresError;

  state.members = members || [];
  state.chores = (chores || []).map(mapChore);
}

async function completeChore(id) {
  const chore = state.chores.find((c) => c.id === id);
  if (!chore) return;
  const doneBy = state.currentMemberId;
  let next;
  if (chore.kind === "repeating") {
    next = {
      ...chore,
      holderIndex: chore.rotate ? chore.holderIndex + 1 : chore.holderIndex,
      dueDate: addDays(todayISO(), chore.repeat === "daily" ? 1 : 7),
      lastDoneAt: new Date().toISOString(),
      lastDoneBy: doneBy,
      done: false,
    };
  } else {
    next = {
      ...chore,
      done: true,
      lastDoneAt: new Date().toISOString(),
      lastDoneBy: doneBy,
    };
  }
  const { error } = await supabase
    .from("chores")
    .update(choreToRow(next, state.householdId))
    .eq("id", id);
  if (error) {
    setBusy(false, error.message);
    return;
  }
  state.chores = state.chores.map((c) => (c.id === id ? next : c));
  render();
}

async function reopenChore(id) {
  const { error } = await supabase.from("chores").update({ done: false }).eq("id", id);
  if (error) {
    setBusy(false, error.message);
    return;
  }
  state.chores = state.chores.map((c) => (c.id === id ? { ...c, done: false } : c));
  render();
}

async function removeChore(id) {
  const { error } = await supabase.from("chores").delete().eq("id", id);
  if (error) {
    setBusy(false, error.message);
    return;
  }
  state.chores = state.chores.filter((c) => c.id !== id);
  render();
}

async function addChore(payload) {
  const row = {
    household_id: state.householdId,
    title: payload.title,
    kind: payload.kind,
    repeat: payload.repeat,
    due_date: payload.dueDate,
    rotate: payload.rotate,
    holder_ids: payload.holderIds,
    holder_index: 0,
    done: false,
  };
  const { data, error } = await supabase.from("chores").insert(row).select("*").single();
  if (error) throw error;
  state.chores.unshift(mapChore(data));
}

function render() {
  const root = document.getElementById("app");
  try {
    if (state.boot) {
      root.innerHTML = `<p class="empty">Loading…</p>`;
    } else if (!state.user) {
      root.innerHTML = authView();
      bindAuth();
    } else if (!state.householdId) {
      root.innerHTML = onboardingView();
      bindOnboarding();
    } else {
      root.innerHTML = appView();
      bindApp();
    }
  } catch (error) {
    console.error(error);
    root.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
  applyTheme();
}

function authView() {
  return `
    <section class="setup card">
      <h1>Household chores</h1>
      <p class="sub">Sign in with email to keep your household list permanent across devices.</p>
      ${state.authError ? `<p class="error">${escapeHtml(state.authError)}</p>` : ""}
      ${state.authMessage ? `<p class="ok-msg">${escapeHtml(state.authMessage)}</p>` : ""}
      <form id="auth-form" class="grid">
        <label class="field">
          <span>Email</span>
          <input name="email" type="email" required placeholder="you@example.com" value="${escapeHtml(state.email)}" />
        </label>
        <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>
          ${state.busy ? "Sending…" : "Send magic link"}
        </button>
      </form>
      <p class="sub">After you click the link in your email, come back here — you’ll stay signed in.</p>
      <div class="theme-slot">${themeToggleButton()}</div>
    </section>
  `;
}

function onboardingView() {
  return `
    <section class="setup card">
      <h1>Set up your household</h1>
      <p class="sub">Signed in as ${escapeHtml(state.user.email || "you")}. Create a household or join with an invite code.</p>
      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}

      <form id="setup-form" class="grid">
        <h2 class="section-title" style="margin:0">Create</h2>
        <label class="field">
          <span>Household name</span>
          <input name="household" required placeholder="Our place" />
        </label>
        <div>
          <span class="sub">People in the household</span>
          <div id="member-fields">
            <div class="member-row"><input name="member" required placeholder="Your name" /></div>
            <div class="member-row"><input name="member" required placeholder="Name" /></div>
          </div>
          <button type="button" class="ghost" id="add-member-field">Add another person</button>
        </div>
        <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>Create household</button>
      </form>

      <hr class="divider" />

      <form id="join-lookup-form" class="grid">
        <h2 class="section-title" style="margin:0">Join</h2>
        <label class="field">
          <span>Invite code</span>
          <input name="code" required placeholder="AB12CD34" value="${escapeHtml(state.joinCode)}" />
        </label>
        <button class="ghost" type="submit" ${state.busy ? "disabled" : ""}>Look up household</button>
      </form>

      ${
        state.joinMembers.length
          ? `
        <form id="join-claim-form" class="grid">
          <p class="sub">Join <strong>${escapeHtml(state.joinHouseholdName)}</strong> as:</p>
          <label class="field">
            <span>Your seat</span>
            <select name="member" required>
              ${state.joinMembers
                .map(
                  (m) =>
                    `<option value="${m.id}" ${m.claimed ? "disabled" : ""}>${escapeHtml(m.name)}${m.claimed ? " (taken)" : ""}</option>`
                )
                .join("")}
            </select>
          </label>
          <button class="primary" type="submit" ${state.busy ? "disabled" : ""}>Join household</button>
        </form>`
          : ""
      }

      <button class="ghost" id="sign-out" type="button">Sign out</button>
      <div class="theme-slot">${themeToggleButton()}</div>
    </section>
  `;
}

function appView() {
  const mineOnly = document.body.dataset.filter === "mine";
  const due = state.chores.filter((c) => isDue(c) && (!mineOnly || isMine(c)));
  const onDemand = state.chores.filter(
    (c) => c.kind === "on_demand" && !c.done && (!mineOnly || isMine(c))
  );
  const upcoming = state.chores.filter((c) => isUpcoming(c) && (!mineOnly || isMine(c)));
  const done = state.chores.filter((c) => c.done && c.kind !== "repeating");
  const myDue = dueForCurrentUser();
  const notifyOk = "Notification" in window && Notification.permission === "granted";

  return `
    <header class="topbar">
      <div>
        <h1 class="brand">${escapeHtml(state.householdName)}</h1>
        <p class="sub">Invite code: <strong>${escapeHtml(state.inviteCode)}</strong> · signed in as ${escapeHtml(currentMember()?.name || "")}</p>
      </div>
      <div class="who">
        <button class="ghost" id="refresh-data" type="button">Refresh</button>
        <button class="ghost" id="sign-out" type="button">Sign out</button>
        ${themeToggleButton()}
      </div>
    </header>

    ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}

    <div class="banner ${myDue.length ? "" : "ok"}">
      <span>${
        myDue.length
          ? `${myDue.length} chore${myDue.length === 1 ? "" : "s"} waiting for you.`
          : "Nothing waiting for you right now."
      }</span>
      ${
        notifyOk
          ? "<span>Reminders on</span>"
          : `<button class="ghost" id="enable-notify" type="button">Enable reminders</button>`
      }
    </div>

    <div class="filters">
      <button class="chip ${mineOnly ? "" : "active"}" data-filter="all" type="button">Everyone</button>
      <button class="chip ${mineOnly ? "active" : ""}" data-filter="mine" type="button">My turn</button>
    </div>

    ${listSection("Due now", due, "Nothing due.")}
    ${listSection("On demand", onDemand, "No open on-demand chores.")}
    ${listSection("Upcoming", upcoming, "No upcoming chores.")}
    ${done.length ? listSection("Done", done, "") : ""}

    ${composerDock()}
  `;
}

function composerDock() {
  return `
    <div class="composer-dock ${composerOpen ? "open" : ""}">
      <div class="composer-inner">
        ${composerOpen ? composerSheet() : ""}
        <button
          class="primary add-chore-btn"
          id="open-composer"
          type="${composerOpen ? "submit" : "button"}"
          ${composerOpen ? 'form="chore-form"' : 'onclick="openChoreComposer()"'}
        >Add a chore</button>
      </div>
    </div>
  `;
}

function composerSheet() {
  return `
    <section class="card composer-sheet" aria-label="Add a chore">
      <div class="composer-head">
        <h2 class="section-title" style="margin:0">Add a chore</h2>
        <button class="ghost" id="close-composer" type="button" onclick="closeChoreComposer()">Close</button>
      </div>
      <form id="chore-form" class="grid">
        <label class="field">
          <span>What needs doing?</span>
          <input name="title" id="chore-title" required placeholder="Take out recycling" />
        </label>
        <div class="row">
          <label class="field">
            <span>When</span>
            <select name="kind" id="kind">
              <option value="repeating">Repeating</option>
              <option value="dated">On a date</option>
              <option value="on_demand">On demand</option>
            </select>
          </label>
          <label class="field" id="repeat-field">
            <span>Repeat</span>
            <select name="repeat">
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </label>
          <label class="field" id="date-field">
            <span>First / due date</span>
            <input name="dueDate" type="date" value="${todayISO()}" />
          </label>
        </div>
        <div class="field">
          <span>Who does it?</span>
          <div class="members">
            ${state.members
              .map(
                (m) =>
                  `<label><input type="checkbox" name="holders" value="${m.id}" checked /> ${escapeHtml(m.name)}</label>`
              )
              .join("")}
          </div>
        </div>
        <label class="members" id="rotate-field">
          <input type="checkbox" name="rotate" checked />
          Alternate between selected people after each completion
        </label>
      </form>
    </section>
  `;
}

function listSection(title, chores, empty) {
  return `
    <h2 class="section-title">${title}</h2>
    ${chores.length ? chores.map(choreCard).join("") : `<p class="empty">${empty}</p>`}
  `;
}

function choreCard(chore) {
  const holderId = currentHolder(chore);
  const mine = isMine(chore);
  const overdue =
    chore.kind !== "on_demand" && chore.dueDate && chore.dueDate < todayISO() && !chore.done;
  const last = chore.lastDoneBy ? `Last: ${escapeHtml(memberName(chore.lastDoneBy))}` : "";

  return `
    <article class="card chore ${chore.done ? "is-done" : ""}">
      <label class="chore-check done-check" title="Done">
        <input type="checkbox" data-toggle-done="${chore.id}" ${chore.done ? "checked" : ""} />
        <span class="sr-only">Done</span>
      </label>
      <div class="chore-body">
        <h3>${escapeHtml(chore.title)}</h3>
        <div class="meta">
          <span class="pill">${scheduleLabel(chore)}</span>
          <span class="pill ${mine ? "mine" : ""}">${holderId ? escapeHtml(memberName(holderId)) : "Anyone"}</span>
          ${chore.kind === "repeating" && chore.rotate ? `<span class="pill">Rotates</span>` : ""}
          ${overdue ? `<span class="pill overdue">Overdue</span>` : ""}
          ${last ? `<span class="last">${last}</span>` : ""}
        </div>
      </div>
      <label class="chore-check remove-check" title="Remove">
        <input type="checkbox" data-delete="${chore.id}" />
        <span>Remove</span>
      </label>
    </article>
  `;
}

function bindAuth() {
  document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = String(new FormData(e.target).get("email")).trim();
    state.email = email;
    state.busy = true;
    state.authError = "";
    state.authMessage = "";
    render();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: siteUrl },
    });
    state.busy = false;
    if (error) {
      state.authError = error.message;
    } else {
      state.authMessage = "Check your email for the magic link, then return to this page.";
    }
    render();
  });
}

function bindOnboarding() {
  document.getElementById("add-member-field")?.addEventListener("click", () => {
    const wrap = document.getElementById("member-fields");
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `<input name="member" placeholder="Name" />`;
    wrap.appendChild(row);
  });

  document.getElementById("setup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const names = data
      .getAll("member")
      .map((n) => String(n).trim())
      .filter(Boolean);
    setBusy(true);
    const { data: created, error } = await supabase.rpc("create_household", {
      p_name: String(data.get("household")).trim(),
      p_member_names: names,
    });
    if (error) {
      setBusy(false, error.message);
      return;
    }
    const row = Array.isArray(created) ? created[0] : created;
    state.inviteCode = row.invite_code;
    await loadHouseholdForUser();
    setBusy(false);
  });

  document.getElementById("join-lookup-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = String(new FormData(e.target).get("code")).trim();
    state.joinCode = code;
    setBusy(true);
    const [{ data: house, error: houseError }, { data: members, error: membersError }] =
      await Promise.all([
        supabase.rpc("lookup_household_by_invite", { p_code: code }),
        supabase.rpc("list_members_by_invite", { p_code: code }),
      ]);
    if (houseError || membersError) {
      setBusy(false, (houseError || membersError).message);
      return;
    }
    const household = Array.isArray(house) ? house[0] : house;
    if (!household) {
      setBusy(false, "No household found for that invite code.");
      return;
    }
    state.joinHouseholdName = household.name;
    state.joinMembers = members || [];
    setBusy(false);
  });

  document.getElementById("join-claim-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const memberId = String(new FormData(e.target).get("member"));
    setBusy(true);
    const { error } = await supabase.rpc("join_household", {
      p_code: state.joinCode,
      p_member_id: memberId,
    });
    if (error) {
      setBusy(false, error.message);
      return;
    }
    await loadHouseholdForUser();
    setBusy(false);
  });

  document.getElementById("sign-out")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    state.user = null;
    state.householdId = "";
    render();
  });
}

function bindApp() {
  document.getElementById("sign-out")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    state.user = null;
    state.householdId = "";
    render();
  });

  document.getElementById("refresh-data")?.addEventListener("click", async () => {
    setBusy(true);
    try {
      await loadHouseholdForUser();
      setBusy(false);
    } catch (error) {
      setBusy(false, error.message);
    }
  });

  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.filter = btn.dataset.filter;
      render();
    });
  });

  document.getElementById("enable-notify")?.addEventListener("click", enableNotifications);

  const kind = document.getElementById("kind");
  if (kind) {
    const syncKind = () => {
      const value = kind.value;
      document.getElementById("repeat-field").style.display = value === "repeating" ? "" : "none";
      document.getElementById("date-field").style.display = value === "on_demand" ? "none" : "";
      document.getElementById("rotate-field").style.display = value === "repeating" ? "" : "none";
    };
    kind.addEventListener("change", syncKind);
    syncKind();
    document.getElementById("chore-title")?.focus();
  }

  document.getElementById("chore-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const holderIds = data.getAll("holders");
    const kindValue = String(data.get("kind"));
    try {
      await addChore({
        title: String(data.get("title")).trim(),
        kind: kindValue,
        repeat: kindValue === "repeating" ? String(data.get("repeat")) : "none",
        dueDate: kindValue === "on_demand" ? null : String(data.get("dueDate") || todayISO()),
        rotate: kindValue === "repeating" && data.get("rotate") === "on" && holderIds.length > 1,
        holderIds,
      });
      composerOpen = false;
      render();
    } catch (error) {
      setBusy(false, error.message);
    }
  });

  document.querySelectorAll("[data-toggle-done]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) completeChore(input.dataset.toggleDone);
      else reopenChore(input.dataset.toggleDone);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      if (confirm("Remove this chore?")) removeChore(input.dataset.delete);
      else input.checked = false;
    });
  });
}

document.addEventListener("click", (event) => {
  const node = event.target instanceof Element ? event.target : event.target.parentElement;
  if (!node?.closest("#toggle-theme")) return;
  event.preventDefault();
  toggleDarkMode();
});

supabase.auth.onAuthStateChange(async () => {
  try {
    await loadHouseholdForUser();
    state.boot = false;
    render();
    if (state.householdId) pingDueNotification();
  } catch (error) {
    state.boot = false;
    state.error = error.message;
    render();
  }
});

(async function boot() {
  try {
    await loadHouseholdForUser();
  } catch (error) {
    state.error = error.message;
  }
  state.boot = false;
  render();
})();
