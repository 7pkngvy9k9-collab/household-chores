import { useState } from "react";

import { useHousehold } from "../household/HouseholdProvider";
import { useNotifications } from "./useNotifications";

export function NotificationBell() {
  const { household, currentMemberId } = useHousehold();
  const notes = useNotifications(currentMemberId, household?.id ?? null);
  const [open, setOpen] = useState(false);

  return (
    <div className="notice-bell">
      <button className="icon-btn" type="button" onClick={() => setOpen((value) => !value)}>
        Inbox{notes.unread > 0 ? ` (${notes.unread})` : ""}
      </button>
      {open ? (
        <div className="card notice-panel">
          <div className="composer-head">
            <h2 className="section-title" style={{ margin: 0 }}>
              Inbox
            </h2>
            <button className="ghost" type="button" onClick={() => void notes.markAllRead()}>
              Mark all read
            </button>
          </div>
          {notes.items.length === 0 ? (
            <p className="empty">No household notices yet.</p>
          ) : (
            notes.items.map((item) => (
              <button
                className="notice-item"
                key={item.id}
                type="button"
                onClick={() => void notes.markRead(item.id)}
              >
                <strong>{item.title}</strong>
                <span className="sub">{item.body}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
