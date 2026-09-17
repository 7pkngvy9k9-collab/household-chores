import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "../auth/AuthProvider";
import { reportError } from "../lib/errors";
import { supabase } from "../lib/supabase";

export type Member = {
  id: string;
  name: string;
};

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
};

type HouseholdValue = {
  loading: boolean;
  error: string;
  household: Household | null;
  members: Member[];
  /** The `members` row that belongs to the signed-in user. */
  currentMemberId: string | null;
  reload: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  const clear = useCallback(() => {
    setHousehold(null);
    setMembers([]);
    setCurrentMemberId(null);
  }, []);

  const load = useCallback(async () => {
    if (!userId) {
      clear();
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const membership = await supabase
      .from("members")
      .select("id, household_id, households(id, name, invite_code)")
      .eq("user_id", userId)
      .maybeSingle();

    if (membership.error) {
      setError(
        reportError(membership.error, "We could not load your household. Please try again."),
      );
      setLoading(false);
      return;
    }

    const row = membership.data;
    if (!row?.households) {
      clear();
      setLoading(false);
      return;
    }

    const roster = await supabase
      .from("members")
      .select("id, name")
      .eq("household_id", row.household_id)
      .order("created_at");

    if (roster.error) {
      setError(reportError(roster.error, "We could not load the household members. Please try again."));
      setLoading(false);
      return;
    }

    setHousehold({
      id: row.households.id,
      name: row.households.name,
      inviteCode: row.households.invite_code,
    });
    setMembers(roster.data);
    setCurrentMemberId(row.id);
    setLoading(false);
  }, [userId, clear]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo<HouseholdValue>(
    () => ({ loading, error, household, members, currentMemberId, reload: load }),
    [loading, error, household, members, currentMemberId, load],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdValue {
  const value = useContext(HouseholdContext);
  if (!value) throw new Error("useHousehold must be used inside a HouseholdProvider");
  return value;
}
