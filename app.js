const STORAGE_KEY = "household-chores.v1";

const uid = () => crypto.randomUUID();

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayISO = () => toISODate(new Date());

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function defaultState() {
  return {
    householdName: "",
    members: [],
    currentMemberId: "",
    chores: [],
    notifyAsked: false,
    darkMode: false,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = load();
let composerOpen = false;

function openChoreComposer() {
  composerOpen = true;
  render();
}

function closeChoreComposer() {
  composerOpen = false;
  render();
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

function completeChore(id) {
  state.chores = state.chores.map((chore) => {
    if (chore.id !== id) return chore;
    const doneBy = state.currentMemberId;
    if (chore.kind === "repeating") {
      const nextIndex = chore.rotate ? chore.holderIndex + 1 : chore.holderIndex;
      const days = chore.repeat === "daily" ? 1 : 7;
      return {
        ...chore,
        holderIndex: nextIndex,
        dueDate: addDays(todayISO(), days),
        lastDoneAt: new Date().toISOString(),
        lastDoneBy: doneBy,
        done: false,
      };
    }
    return {
      ...chore,
      done: true,
      lastDoneAt: new Date().toISOString(),
      lastDoneBy: doneBy,
    };
  });
  persist();
}

function reopenChore(id) {
  state.chores = state.chores.map((chore) =>
    chore.id === id ? { ...chore, done: false } : chore
  );
  persist();
}

function removeChore(id) {
  state.chores = state.chores.filter((chore) => chore.id !== id);
  persist();
}

function persist() {
  save(state);
  applyTheme();
  render();
}

function applyTheme() {
  document.documentElement.classList.toggle("theme-dark", Boolean(state.darkMode));
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  persist();
}

function themeToggleButton() {
  return `<button class="ghost" id="toggle-theme" type="button">${
    state.darkMode ? "Light mode" : "Dark mode"
  }</button>`;
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
  save(state);
  if (permission === "granted") {
    pingDueNotification();
  }
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

function render() {
  const root = document.getElementById("app");
  try {
    if (!state.members.length) {
      root.innerHTML = setupView();
      bindSetup();
    } else if (!state.currentMemberId) {
      root.innerHTML = loginView();
      bindLogin();
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

function setupView() {
  return `
    <section class="setup card">
      <h1>Set up your household</h1>
      <p class="sub">Add the people who share chores. Each person later “logs in” by picking their name.</p>
      <form id="setup-form" class="grid">
        <label class="field">
          <span>Household name</span>
          <input name="household" required placeholder="Our place" />
        </label>
        <div>
          <span class="sub">People in the household</span>
          <div id="member-fields">
            <div class="member-row"><input name="member" required placeholder="Name" /></div>
            <div class="member-row"><input name="member" required placeholder="Name" /></div>
          </div>
          <button type="button" class="ghost" id="add-member-field">Add another person</button>
        </div>
        <button class="primary" type="submit">Create household</button>
      </form>
      <div class="theme-slot">${themeToggleButton()}</div>
    </section>
  `;
}

function loginView() {
  const options = state.members
    .map((m) => `<option value="${m.id}">${escapeHtml(m.name)}</option>`)
    .join("");
  return `
    <section class="setup card">
      <h1>${escapeHtml(state.householdName)}</h1>
      <p class="sub">Who’s using the list right now?</p>
      <form id="login-form" class="grid">
        <label class="field">
          <span>Your name</span>
          <select name="member">${options}</select>
        </label>
        <button class="primary" type="submit">Continue</button>
      </form>
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
        <p class="sub">One list. Repeating, dated, or on demand — with rotating owners.</p>
      </div>
      <div class="who">
        <label for="switch-user">Signed in as</label>
        <select id="switch-user">
          ${state.members
            .map(
              (m) =>
                `<option value="${m.id}" ${m.id === state.currentMemberId ? "selected" : ""}>${escapeHtml(m.name)}</option>`
            )
            .join("")}
        </select>
        <button class="ghost" id="sign-out" type="button">Switch person</button>
        ${themeToggleButton()}
      </div>
    </header>

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
    ${listSection("On demand", onDemand.filter((c) => !due.includes(c)), "No open on-demand chores.")}
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
    ${
      chores.length
        ? chores.map(choreCard).join("")
        : `<p class="empty">${empty}</p>`
    }
  `;
}

function choreCard(chore) {
  const holderId = currentHolder(chore);
  const mine = isMine(chore);
  const overdue = chore.kind !== "on_demand" && chore.dueDate && chore.dueDate < todayISO() && !chore.done;
  const last = chore.lastDoneBy
    ? `Last: ${escapeHtml(memberName(chore.lastDoneBy))}`
    : "";

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function bindSetup() {
  document.getElementById("add-member-field").addEventListener("click", () => {
    const wrap = document.getElementById("member-fields");
    const row = document.createElement("div");
    row.className = "member-row";
    row.innerHTML = `<input name="member" placeholder="Name" />`;
    wrap.appendChild(row);
  });
  document.getElementById("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const names = data
      .getAll("member")
      .map((n) => String(n).trim())
      .filter(Boolean);
    if (names.length < 2) {
      alert("Add at least two people so rotation can be tested.");
      return;
    }
    state.householdName = String(data.get("household")).trim();
    state.members = names.map((name) => ({ id: uid(), name }));
    persist();
  });
}

function bindLogin() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.currentMemberId = new FormData(e.target).get("member");
    persist();
    pingDueNotification();
  });
}

function bindApp() {
  document.getElementById("switch-user").addEventListener("change", (e) => {
    state.currentMemberId = e.target.value;
    persist();
  });
  document.getElementById("sign-out").addEventListener("click", () => {
    state.currentMemberId = "";
    persist();
  });
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.body.dataset.filter = btn.dataset.filter;
      render();
    });
  });
  const notifyBtn = document.getElementById("enable-notify");
  if (notifyBtn) notifyBtn.addEventListener("click", enableNotifications);

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

  const choreForm = document.getElementById("chore-form");
  if (choreForm) {
    choreForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const holderIds = data.getAll("holders");
      const kindValue = String(data.get("kind"));
      state.chores.unshift({
        id: uid(),
        title: String(data.get("title")).trim(),
        kind: kindValue,
        repeat: kindValue === "repeating" ? String(data.get("repeat")) : "none",
        dueDate: kindValue === "on_demand" ? null : String(data.get("dueDate") || todayISO()),
        rotate: kindValue === "repeating" && data.get("rotate") === "on" && holderIds.length > 1,
        holderIds,
        holderIndex: 0,
        done: false,
        lastDoneAt: null,
        lastDoneBy: null,
      });
      composerOpen = false;
      persist();
    });
  }

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

render();

document.addEventListener("click", (event) => {
  const node = event.target instanceof Element ? event.target : event.target.parentElement;
  if (!node?.closest("#toggle-theme")) return;
  event.preventDefault();
  toggleDarkMode();
});
