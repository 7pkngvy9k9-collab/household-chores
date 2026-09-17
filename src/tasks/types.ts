export const CHORE_KINDS = ["repeating", "dated", "on_demand"] as const;
export const CHORE_REPEATS = ["none", "daily", "weekly", "monthly"] as const;

export type ChoreKind = (typeof CHORE_KINDS)[number];
export type ChoreRepeat = (typeof CHORE_REPEATS)[number];

export type Chore = {
  id: string;
  title: string;
  kind: ChoreKind;
  repeat: ChoreRepeat;
  repeatInterval: number;
  dueDate: string | null;
  rotate: boolean;
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
  repeatInterval: number;
  dueDate: string | null;
  rotate: boolean;
  holderIds: string[];
};
