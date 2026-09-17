export const CHORE_KINDS = ["repeating", "dated", "on_demand"] as const;
export const CHORE_REPEATS = ["none", "daily", "weekly"] as const;

export type ChoreKind = (typeof CHORE_KINDS)[number];
export type ChoreRepeat = (typeof CHORE_REPEATS)[number];

export type Chore = {
  id: string;
  title: string;
  kind: ChoreKind;
  repeat: ChoreRepeat;
  dueDate: string | null;
  rotate: boolean;
  /** Members eligible for this chore, in rotation order. */
  holderIds: string[];
  holderIndex: number;
  done: boolean;
  lastDoneAt: string | null;
  lastDoneBy: string | null;
};

export type NewChore = {
  title: string;
  kind: ChoreKind;
  repeat: ChoreRepeat;
  dueDate: string | null;
  rotate: boolean;
  holderIds: string[];
};
