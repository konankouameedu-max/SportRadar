"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

type AuthCtx = {
  profile: Profile | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ initialProfile, children }: { initialProfile: Profile | null; children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => setProfile(initialProfile), [initialProfile]);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setProfile(null);
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile((data as Profile) ?? null);
  }, [supabase]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setProfile(null);
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase, refresh]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  return <Ctx.Provider value={{ profile, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return v;
}
