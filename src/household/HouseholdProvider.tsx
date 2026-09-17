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

export const MEMBER_ROLES = ["owner", "admin", "member"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type Member = {
  id: string;
  name: string;
  role: MemberRole;
  userId: string | null;
};

export type Household = {
  id: string;
  name: string;
  inviteCode: string;
  currency: string;
  timezone: string;
};

type HouseholdValue = {
  loading: boolean;
  error: string;
  household: Household | null;
  members: Member[];
  currentMemberId: string | null;
  currentRole: MemberRole | null;
  reload: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdValue | null>(null);

function toRole(value: string): MemberRole {
  return MEMBER_ROLES.find((role) => role === value) ?? "member";
}

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
      .from("household_members")
      .select("id, household_id, role, households(id, name, invite_code, currency, timezone)")
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
    const nested = row?.households;
    const house = Array.isArray(nested) ? nested[0] : nested;
    if (!row || !house) {
      clear();
      setLoading(false);
      return;
    }

    const roster = await supabase
      .from("household_members")
      .select("id, name, role, user_id")
      .eq("household_id", row.household_id)
      .order("created_at");

    if (roster.error) {
      setError(reportError(roster.error, "We could not load the household members. Please try again."));
      setLoading(false);
      return;
    }

    setHousehold({
      id: house.id,
      name: house.name,
      inviteCode: house.invite_code,
      currency: house.currency,
      timezone: house.timezone,
    });
    setMembers(
      roster.data.map((member) => ({
        id: member.id,
        name: member.name,
        role: toRole(member.role),
        userId: member.user_id,
      })),
    );
    setCurrentMemberId(row.id);
    setLoading(false);
  }, [userId, clear]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentRole = members.find((member) => member.id === currentMemberId)?.role ?? null;

  const value = useMemo<HouseholdValue>(
    () => ({ loading, error, household, members, currentMemberId, currentRole, reload: load }),
    [loading, error, household, members, currentMemberId, currentRole, load],
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold(): HouseholdValue {
  const value = useContext(HouseholdContext);
  if (!value) throw new Error("useHousehold must be used inside a HouseholdProvider");
  return value;
}
