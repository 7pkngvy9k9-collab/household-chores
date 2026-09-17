export function supportsNotifications(): boolean {
  return "Notification" in window;
}

export function notificationsEnabled(): boolean {
  return supportsNotifications() && Notification.permission === "granted";
}

export async function requestNotifications(): Promise<boolean> {
  if (!supportsNotifications()) return false;
  return (await Notification.requestPermission()) === "granted";
}

export function notifyWaiting(memberName: string, count: number): void {
  if (count === 0 || !notificationsEnabled()) return;
  new Notification("Household chores", {
    body: `${memberName}: ${count} chore${count === 1 ? "" : "s"} waiting.`,
  });
}
